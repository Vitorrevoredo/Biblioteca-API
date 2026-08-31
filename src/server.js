const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DB_PATH = path.join(__dirname, 'database.json');
const WEB_PATH = path.join(__dirname, '..', 'web');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

// Função auxiliar para ler o arquivo JSON do banco de dados
function readDatabase() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return [];
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler o banco de dados:', error);
        return [];
    }
}

// Função auxiliar para escrever no arquivo JSON do banco de dados
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Erro ao gravar no banco de dados:', error);
        return false;
    }
}

// Função auxiliar para extrair e fazer o parse do corpo JSON da requisição
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            if (!body) {
                resolve(null);
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error('JSON inválido ou malformado no corpo da requisição.'));
            }
        });
    });
}

// Função auxiliar para enviar resposta JSON
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// Serve arquivos estáticos da pasta web
function serveStaticFile(res, pathname) {
    let filePath = path.join(WEB_PATH, pathname === '/' ? 'index.html' : pathname);
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile(path.join(WEB_PATH, 'index.html'), (err, fallbackContent) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('Página não encontrada e index.html ausente.', 'utf-8');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(fallbackContent, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end(`Erro no servidor: ${error.code}..\n`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// Criação do servidor HTTP nativo
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Se não for API, serve estáticos
    if (!pathname.startsWith('/api/')) {
        return serveStaticFile(res, pathname);
    }

    // Rotas da API
    if (pathname === '/api/livros' && req.method === 'GET') {
        const livros = readDatabase();
        sendJSON(res, 200, livros);
        return;
    }

    if (pathname === '/api/livros' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            if (!body) return sendJSON(res, 400, { erro: "O corpo da requisição não pode estar vazio." });

            const { titulo, autor, genero, anoPublicacao, paginas, sinopse, palavrasChave } = body;

            // Validações detalhadas do livro
            if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') return sendJSON(res, 400, { erro: "O campo 'titulo' é obrigatório." });
            if (!autor || typeof autor !== 'string' || autor.trim() === '') return sendJSON(res, 400, { erro: "O campo 'autor' é obrigatório." });
            if (!genero || typeof genero !== 'string' || genero.trim() === '') return sendJSON(res, 400, { erro: "O campo 'genero' é obrigatório." });
            if (anoPublicacao === undefined || typeof anoPublicacao !== 'number' || !Number.isInteger(anoPublicacao)) return sendJSON(res, 400, { erro: "O campo 'anoPublicacao' é inválido." });
            if (paginas === undefined || typeof paginas !== 'number' || !Number.isInteger(paginas) || paginas <= 0) return sendJSON(res, 400, { erro: "O campo 'paginas' é inválido." });
            if (!sinopse || typeof sinopse !== 'string' || sinopse.trim() === '') return sendJSON(res, 400, { erro: "O campo 'sinopse' é obrigatório." });
            if (!palavrasChave || !Array.isArray(palavrasChave) || palavrasChave.length === 0) return sendJSON(res, 400, { erro: "O campo 'palavrasChave' deve ser um array." });

            const livros = readDatabase();
            const maxId = livros.reduce((max, livro) => Math.max(max, parseInt(livro.id) || 0), 0);
            const newId = (maxId + 1).toString();

            const novoLivro = {
                id: newId,
                titulo: titulo.trim(),
                autor: autor.trim(),
                genero: genero.trim(),
                anoPublicacao,
                paginas,
                sinopse: sinopse.trim(),
                palavrasChave: palavrasChave.map(n => typeof n === 'string' ? n.trim() : '').filter(n => n !== '')
            };

            livros.push(novoLivro);
            const sucesso = writeDatabase(livros);

            if (!sucesso) return sendJSON(res, 500, { erro: "Falha interna ao salvar as alterações." });
            return sendJSON(res, 201, novoLivro);
        } catch (error) {
            return sendJSON(res, 400, { erro: error.message });
        }
    }

    if (pathname.startsWith('/api/livros/') && req.method === 'DELETE') {
        const id = pathname.split('/')[3];
        if (!id) return sendJSON(res, 400, { erro: "ID não fornecido." });

        const livros = readDatabase();
        const index = livros.findIndex(l => l.id === id);

        if (index === -1) {
            return sendJSON(res, 404, { erro: "Livro não encontrado." });
        }

        livros.splice(index, 1);
        const sucesso = writeDatabase(livros);

        if (!sucesso) return sendJSON(res, 500, { erro: "Falha interna ao excluir." });
        
        return sendJSON(res, 200, { mensagem: "Livro removido com sucesso." });
    }

    sendJSON(res, 404, { erro: "Recurso não encontrado na API." });
});

// Inicialização do servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`- Interface Web servida em http://localhost:${PORT}/`);
    console.log(`- GET  http://localhost:${PORT}/api/livros`);
    console.log(`- POST http://localhost:${PORT}/api/livros`);
    console.log(`- DELETE http://localhost:${PORT}/api/livros/:id`);
});
