const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DB_PATH = path.join(__dirname, 'database.json');

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

// Criação do servidor HTTP nativo
const server = http.createServer(async (req, res) => {
    // Configurações básicas de CORS para permitir requisições externas caso necessário
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manipula requisição OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Rota: GET /api/livros
    if (pathname === '/api/livros' && req.method === 'GET') {
        const livros = readDatabase();
        sendJSON(res, 200, livros);
        return;
    }

    // Rota: POST /api/livros
    if (pathname === '/api/livros' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            
            if (!body) {
                sendJSON(res, 400, { erro: "O corpo da requisição não pode estar vazio." });
                return;
            }

            const { titulo, autor, genero, anoPublicacao, paginas, sinopse, palavrasChave } = body;

            // Validações detalhadas do livro
            if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'titulo' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (!autor || typeof autor !== 'string' || autor.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'autor' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (!genero || typeof genero !== 'string' || genero.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'genero' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (anoPublicacao === undefined || typeof anoPublicacao !== 'number' || !Number.isInteger(anoPublicacao) || anoPublicacao < 1000 || anoPublicacao > new Date().getFullYear()) {
                sendJSON(res, 400, { erro: `O campo 'anoPublicacao' é obrigatório, deve ser um número inteiro entre 1000 e ${new Date().getFullYear()}.` });
                return;
            }
            if (paginas === undefined || typeof paginas !== 'number' || !Number.isInteger(paginas) || paginas <= 0) {
                sendJSON(res, 400, { erro: "O campo 'paginas' é obrigatório e deve ser um número inteiro maior que zero." });
                return;
            }
            if (!sinopse || typeof sinopse !== 'string' || sinopse.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'sinopse' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (!palavrasChave || !Array.isArray(palavrasChave) || palavrasChave.length === 0) {
                sendJSON(res, 400, { erro: "O campo 'palavrasChave' é obrigatório e deve ser um array com ao menos uma palavra-chave descritora." });
                return;
            }

            const livros = readDatabase();
            
            // Geração de ID incremental a partir dos dados persistidos
            const maxId = livros.reduce((max, livro) => Math.max(max, parseInt(livro.id) || 0), 0);
            const newId = (maxId + 1).toString();

            const novoLivro = {
                id: newId,
                titulo: titulo.trim(),
                autor: autor.trim(),
                genero: genero.trim(),
                anoPublicacao: anoPublicacao,
                paginas: paginas,
                sinopse: sinopse.trim(),
                palavrasChave: palavrasChave.map(n => typeof n === 'string' ? n.trim() : '').filter(n => n !== '')
            };

            livros.push(novoLivro);
            const sucesso = writeDatabase(livros);

            if (!sucesso) {
                sendJSON(res, 500, { erro: "Falha interna ao salvar as alterações no banco de dados." });
                return;
            }

            sendJSON(res, 201, novoLivro);
            return;
        } catch (error) {
            sendJSON(res, 400, { erro: error.message });
            return;
        }
    }

    // Endpoint correto mas método incorreto
    if (pathname === '/api/livros') {
        res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ erro: `O método ${req.method} não é suportado para este endpoint.` }));
        return;
    }

    // Rota não mapeada
    sendJSON(res, 404, { erro: "Recurso não encontrado. Use GET /api/livros para buscar ou POST /api/livros para adicionar." });
});

// Inicialização do servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`- GET  http://localhost:${PORT}/api/livros`);
    console.log(`- POST http://localhost:${PORT}/api/livros`);
});
