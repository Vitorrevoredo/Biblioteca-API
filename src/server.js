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

    // Rota: GET /api/cafes
    if (pathname === '/api/cafes' && req.method === 'GET') {
        const cafes = readDatabase();
        sendJSON(res, 200, cafes);
        return;
    }

    // Rota: POST /api/cafes
    if (pathname === '/api/cafes' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            
            if (!body) {
                sendJSON(res, 400, { erro: "O corpo da requisição não pode estar vazio." });
                return;
            }

            const { nome, fazenda, regiao, notaSCA, processo, notasSensoriais } = body;

            // Validações detalhadas do café de especialidade
            if (!nome || typeof nome !== 'string' || nome.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'nome' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (!fazenda || typeof fazenda !== 'string' || fazenda.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'fazenda' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (!regiao || typeof regiao !== 'string' || regiao.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'regiao' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (notaSCA === undefined || typeof notaSCA !== 'number' || notaSCA < 80 || notaSCA > 100) {
                sendJSON(res, 400, { erro: "O campo 'notaSCA' é obrigatório, deve ser numérico e ter valor entre 80 e 100 (padrão SCA de cafés especiais)." });
                return;
            }
            if (!processo || typeof processo !== 'string' || processo.trim() === '') {
                sendJSON(res, 400, { erro: "O campo 'processo' é obrigatório e deve ser uma string não vazia." });
                return;
            }
            if (!notasSensoriais || !Array.isArray(notasSensoriais) || notasSensoriais.length === 0) {
                sendJSON(res, 400, { erro: "O campo 'notasSensoriais' é obrigatório e deve ser um array com ao menos uma nota descritora." });
                return;
            }

            const cafes = readDatabase();
            
            // Geração de ID incremental a partir dos dados persistidos
            const maxId = cafes.reduce((max, cafe) => Math.max(max, parseInt(cafe.id) || 0), 0);
            const newId = (maxId + 1).toString();

            const novoCafe = {
                id: newId,
                nome: nome.trim(),
                fazenda: fazenda.trim(),
                regiao: regiao.trim(),
                notaSCA: parseFloat(notaSCA.toFixed(2)),
                processo: processo.trim(),
                notasSensoriais: notasSensoriais.map(n => typeof n === 'string' ? n.trim() : '').filter(n => n !== '')
            };

            cafes.push(novoCafe);
            const sucesso = writeDatabase(cafes);

            if (!sucesso) {
                sendJSON(res, 500, { erro: "Falha interna ao salvar as alterações no banco de dados." });
                return;
            }

            sendJSON(res, 201, novoCafe);
            return;
        } catch (error) {
            sendJSON(res, 400, { erro: error.message });
            return;
        }
    }

    // Endpoint correto mas método incorreto
    if (pathname === '/api/cafes') {
        res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ erro: `O método ${req.method} não é suportado para este endpoint.` }));
        return;
    }

    // Rota não mapeada
    sendJSON(res, 404, { erro: "Recurso não encontrado. Use GET /api/cafes para buscar ou POST /api/cafes para adicionar." });
});

// Inicialização do servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`- GET  http://localhost:${PORT}/api/cafes`);
    console.log(`- POST http://localhost:${PORT}/api/cafes`);
});
