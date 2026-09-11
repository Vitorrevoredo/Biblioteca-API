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
                return resolve(null);
            }
            try {
                const parsed = JSON.parse(body);
                resolve(parsed);
            } catch (error) {
                reject(new Error('JSON inválido ou malformado'));
            }
        });
    });
}

// Função auxiliar para responder com JSON e cabeçalhos apropriados
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// Função auxiliar para servir arquivos estáticos
function serveStaticFile(res, filePath) {
    let safePath = filePath;
    if (safePath === '/' || safePath === '') {
        safePath = '/index.html';
    }

    const fullPath = path.join(WEB_PATH, safePath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(fullPath, (error, content) => {
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    // 1. GET /api/livros (Listar todos)
    if (pathname === '/api/livros' && req.method === 'GET') {
        const livros = readDatabase();
        sendJSON(res, 200, livros);
        return;
    }

    // 2. GET /api/livros/:id (Buscar por ID)
    if (pathname.startsWith('/api/livros/') && req.method === 'GET') {
        const id = pathname.split('/')[3];
        if (!id) return sendJSON(res, 400, { erro: "ID não fornecido." });

        const livros = readDatabase();
        const livro = livros.find(l => l.id === id);

        if (!livro) {
            return sendJSON(res, 404, { erro: "Livro não encontrado." });
        }

        return sendJSON(res, 200, livro);
    }

    // 3. POST /api/livros (Criar novo)
    if (pathname === '/api/livros' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            if (!body) return sendJSON(res, 400, { erro: "O corpo da requisição não pode estar vazio." });

            const { titulo, autor, genero, anoPublicacao, paginas, sinopse, palavrasChave, capa } = body;

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
                capa: (capa && typeof capa === 'string' && capa.trim() !== '') ? capa.trim() : undefined,
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

    // 4. PUT /api/livros/:id (Atualizar completo)
    if (pathname.startsWith('/api/livros/') && req.method === 'PUT') {
        const id = pathname.split('/')[3];
        if (!id) return sendJSON(res, 400, { erro: "ID não fornecido." });

        const livros = readDatabase();
        const index = livros.findIndex(l => l.id === id);

        if (index === -1) {
            return sendJSON(res, 404, { erro: "Livro não encontrado." });
        }

        try {
            const body = await getRequestBody(req);
            if (!body) return sendJSON(res, 400, { erro: "O corpo da requisição não pode estar vazio." });

            const { titulo, autor, genero, anoPublicacao, paginas, sinopse, palavrasChave, capa } = body;

            if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') return sendJSON(res, 400, { erro: "O campo 'titulo' é obrigatório." });
            if (!autor || typeof autor !== 'string' || autor.trim() === '') return sendJSON(res, 400, { erro: "O campo 'autor' é obrigatório." });
            if (!genero || typeof genero !== 'string' || genero.trim() === '') return sendJSON(res, 400, { erro: "O campo 'genero' é obrigatório." });
            if (anoPublicacao === undefined || typeof anoPublicacao !== 'number' || !Number.isInteger(anoPublicacao)) return sendJSON(res, 400, { erro: "O campo 'anoPublicacao' é inválido." });
            if (paginas === undefined || typeof paginas !== 'number' || !Number.isInteger(paginas) || paginas <= 0) return sendJSON(res, 400, { erro: "O campo 'paginas' é inválido." });
            if (!sinopse || typeof sinopse !== 'string' || sinopse.trim() === '') return sendJSON(res, 400, { erro: "O campo 'sinopse' é obrigatório." });
            if (!palavrasChave || !Array.isArray(palavrasChave) || palavrasChave.length === 0) return sendJSON(res, 400, { erro: "O campo 'palavrasChave' deve ser um array." });

            livros[index] = {
                id,
                titulo: titulo.trim(),
                autor: autor.trim(),
                genero: genero.trim(),
                anoPublicacao,
                paginas,
                capa: (capa && typeof capa === 'string' && capa.trim() !== '') ? capa.trim() : livros[index].capa,
                sinopse: sinopse.trim(),
                palavrasChave: palavrasChave.map(n => typeof n === 'string' ? n.trim() : '').filter(n => n !== '')
            };

            const sucesso = writeDatabase(livros);
            if (!sucesso) return sendJSON(res, 500, { erro: "Falha interna ao atualizar." });

            return sendJSON(res, 200, livros[index]);
        } catch (error) {
            return sendJSON(res, 400, { erro: error.message });
        }
    }

    // 5. DELETE /api/livros/:id (Excluir)
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

// Inicialização do servidor (somente quando executado diretamente)
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
        console.log(`- Interface Web servida em http://localhost:${PORT}/`);
        console.log(`- GET    http://localhost:${PORT}/api/livros`);
        console.log(`- GET    http://localhost:${PORT}/api/livros/:id`);
        console.log(`- POST   http://localhost:${PORT}/api/livros`);
        console.log(`- PUT    http://localhost:${PORT}/api/livros/:id`);
        console.log(`- DELETE http://localhost:${PORT}/api/livros/:id`);
    });
}

// Exporta funções e servidor para testes
module.exports = { readDatabase, writeDatabase, getRequestBody, sendJSON, serveStaticFile, server, WEB_PATH };
