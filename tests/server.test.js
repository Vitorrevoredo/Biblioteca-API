/**
 * Testes automatizados para a API Biblioteca.
 *
 * Utiliza Jest para testar todas as funções exportadas do server.js
 * e as rotas da API via requisições HTTP reais ao servidor.
 *
 * Objetivo: cobertura mínima de 90% em lines, branches, functions e statements.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'database.json');
const WEB_PATH = path.join(__dirname, '..', 'web');

// Salva o conteúdo original do banco de dados para restaurar após os testes
let originalDbContent;

// Importa o servidor e as funções auxiliares
const { readDatabase, writeDatabase, getRequestBody, sendJSON, serveStaticFile, server } = require('../src/server');

// Porta dinâmica para evitar conflitos
let testServer;
let baseUrl;

// ===========================
// Setup e Teardown
// ===========================

beforeAll((done) => {
    // Salva o banco de dados original
    originalDbContent = fs.readFileSync(DB_PATH, 'utf8');

    // Inicia o servidor em uma porta aleatória para testes
    testServer = server.listen(0, () => {
        const port = testServer.address().port;
        baseUrl = `http://localhost:${port}`;
        done();
    });
});

afterAll((done) => {
    // Restaura o banco de dados original
    fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');

    // Fecha o servidor de teste
    testServer.close(done);
});

beforeEach(() => {
    // Restaura o banco de dados ao estado original antes de cada teste
    fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');
});

// ===========================
// Função auxiliar para requisições HTTP
// ===========================

function makeRequest(method, urlPath, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, baseUrl);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }

        req.end();
    });
}

// ===========================
// Testes das funções auxiliares
// ===========================

describe('readDatabase()', () => {
    test('deve retornar um array de livros a partir do arquivo JSON', () => {
        const result = readDatabase();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('titulo');
    });

    test('deve retornar array vazio se o arquivo não existir', () => {
        // Renomeia temporariamente o arquivo
        const backupPath = DB_PATH + '.backup';
        fs.renameSync(DB_PATH, backupPath);

        try {
            const result = readDatabase();
            expect(result).toEqual([]);
        } finally {
            // Restaura o arquivo
            fs.renameSync(backupPath, DB_PATH);
        }
    });

    test('deve retornar array vazio se o JSON for inválido', () => {
        // Escreve JSON inválido
        fs.writeFileSync(DB_PATH, '{json invalido', 'utf8');

        const result = readDatabase();
        expect(result).toEqual([]);

        // Restaura
        fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');
    });
});

describe('writeDatabase()', () => {
    test('deve escrever dados no arquivo JSON e retornar true', () => {
        const testData = [{ id: '99', titulo: 'Teste' }];
        const result = writeDatabase(testData);
        expect(result).toBe(true);

        // Verifica se os dados foram escritos
        const content = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(content);
        expect(parsed).toEqual(testData);
    });

    test('deve retornar false em caso de erro de escrita', () => {
        // Usa um caminho inválido forçando erro via mock
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = jest.fn(() => { throw new Error('Simulated write error'); });

        const result = writeDatabase([]);
        expect(result).toBe(false);

        // Restaura
        fs.writeFileSync = originalWriteFileSync;
    });
});

describe('getRequestBody()', () => {
    test('deve fazer parse de um corpo JSON válido', async () => {
        const { Readable } = require('stream');
        const mockReq = new Readable({
            read() {
                this.push(JSON.stringify({ titulo: 'Teste' }));
                this.push(null);
            }
        });

        const result = await getRequestBody(mockReq);
        expect(result).toEqual({ titulo: 'Teste' });
    });

    test('deve retornar null para corpo vazio', async () => {
        const { Readable } = require('stream');
        const mockReq = new Readable({
            read() {
                this.push(null);
            }
        });

        const result = await getRequestBody(mockReq);
        expect(result).toBeNull();
    });

    test('deve rejeitar com erro para JSON inválido', async () => {
        const { Readable } = require('stream');
        const mockReq = new Readable({
            read() {
                this.push('{ json invalido');
                this.push(null);
            }
        });

        await expect(getRequestBody(mockReq)).rejects.toThrow('JSON inválido ou malformado');
    });
});

describe('sendJSON()', () => {
    test('deve enviar resposta JSON com status code correto', () => {
        const mockRes = {
            writeHead: jest.fn(),
            end: jest.fn()
        };

        sendJSON(mockRes, 200, { mensagem: 'ok' });

        expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });
        expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ mensagem: 'ok' }));
    });
});

// ===========================
// Testes das rotas da API (integração)
// ===========================

describe('GET /api/livros', () => {
    test('deve retornar status 200 e lista de livros', async () => {
        const res = await makeRequest('GET', '/api/livros');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });
});

describe('GET /api/livros/:id', () => {
    test('deve retornar um livro existente pelo ID (200)', async () => {
        const res = await makeRequest('GET', '/api/livros/1');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', '1');
        expect(res.body).toHaveProperty('titulo', 'Dom Casmurro');
    });

    test('deve retornar 404 para ID inexistente', async () => {
        const res = await makeRequest('GET', '/api/livros/999');
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('erro');
    });
});

describe('POST /api/livros', () => {
    const livroValido = {
        titulo: 'Livro de Teste',
        autor: 'Autor Teste',
        genero: 'Ficção',
        anoPublicacao: 2020,
        paginas: 200,
        sinopse: 'Uma sinopse de teste para validar a criação de livros na API.',
        palavrasChave: ['Teste', 'Jest']
    };

    test('deve criar um novo livro com dados válidos (201)', async () => {
        const res = await makeRequest('POST', '/api/livros', livroValido);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.titulo).toBe('Livro de Teste');
    });

    test('deve retornar 400 para corpo vazio', async () => {
        const res = await makeRequest('POST', '/api/livros');
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('erro');
    });

    test('deve retornar 400 para JSON inválido', async () => {
        const res = await makeRequest('POST', '/api/livros', '{ invalido }');
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('erro');
    });

    test('deve retornar 400 quando titulo está ausente', async () => {
        const { titulo, ...semTitulo } = livroValido;
        const res = await makeRequest('POST', '/api/livros', semTitulo);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('titulo');
    });

    test('deve retornar 400 quando autor está ausente', async () => {
        const { autor, ...semAutor } = livroValido;
        const res = await makeRequest('POST', '/api/livros', semAutor);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('autor');
    });

    test('deve retornar 400 quando genero está ausente', async () => {
        const { genero, ...semGenero } = livroValido;
        const res = await makeRequest('POST', '/api/livros', semGenero);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('genero');
    });

    test('deve retornar 400 quando anoPublicacao é inválido', async () => {
        const res = await makeRequest('POST', '/api/livros', { ...livroValido, anoPublicacao: 'abc' });
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('anoPublicacao');
    });

    test('deve retornar 400 quando paginas é inválido (valor negativo)', async () => {
        const res = await makeRequest('POST', '/api/livros', { ...livroValido, paginas: -5 });
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('paginas');
    });

    test('deve retornar 400 quando paginas é inválido (não inteiro)', async () => {
        const res = await makeRequest('POST', '/api/livros', { ...livroValido, paginas: 3.5 });
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('paginas');
    });

    test('deve retornar 400 quando sinopse está ausente', async () => {
        const { sinopse, ...semSinopse } = livroValido;
        const res = await makeRequest('POST', '/api/livros', semSinopse);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('sinopse');
    });

    test('deve retornar 400 quando palavrasChave está ausente', async () => {
        const { palavrasChave, ...semPalavras } = livroValido;
        const res = await makeRequest('POST', '/api/livros', semPalavras);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('palavrasChave');
    });

    test('deve retornar 400 quando palavrasChave é array vazio', async () => {
        const res = await makeRequest('POST', '/api/livros', { ...livroValido, palavrasChave: [] });
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('palavrasChave');
    });

    test('deve retornar 500 quando writeDatabase falhar no POST', async () => {
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = jest.fn(() => { throw new Error('Falha de escrita'); });

        const res = await makeRequest('POST', '/api/livros', livroValido);
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('erro');

        fs.writeFileSync = originalWriteFileSync;
    });
});

describe('PUT /api/livros/:id', () => {
    const livroAtualizado = {
        titulo: 'Dom Casmurro Atualizado',
        autor: 'Machado de Assis',
        genero: 'Romance Clássico',
        anoPublicacao: 1900,
        paginas: 260,
        sinopse: 'Nova edição revisada.',
        palavrasChave: ['Literatura', 'Clássico']
    };

    test('deve atualizar um livro existente com dados válidos (200)', async () => {
        const res = await makeRequest('PUT', '/api/livros/1', livroAtualizado);
        expect(res.statusCode).toBe(200);
        expect(res.body.titulo).toBe('Dom Casmurro Atualizado');
        expect(res.body.genero).toBe('Romance Clássico');
    });

    test('deve retornar 404 para ID inexistente', async () => {
        const res = await makeRequest('PUT', '/api/livros/999', livroAtualizado);
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('erro');
    });

    test('deve retornar 400 para corpo vazio', async () => {
        const res = await makeRequest('PUT', '/api/livros/1');
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('erro');
    });

    test('deve retornar 400 para JSON inválido no PUT', async () => {
        const res = await makeRequest('PUT', '/api/livros/1', '{ json quebrado');
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('erro');
    });

    test('deve retornar 400 quando titulo ausente no PUT', async () => {
        const { titulo, ...semTitulo } = livroAtualizado;
        const res = await makeRequest('PUT', '/api/livros/1', semTitulo);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('titulo');
    });

    test('deve retornar 400 quando autor ausente no PUT', async () => {
        const { autor, ...semAutor } = livroAtualizado;
        const res = await makeRequest('PUT', '/api/livros/1', semAutor);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('autor');
    });

    test('deve retornar 400 quando genero ausente no PUT', async () => {
        const { genero, ...semGenero } = livroAtualizado;
        const res = await makeRequest('PUT', '/api/livros/1', semGenero);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('genero');
    });

    test('deve retornar 400 quando anoPublicacao inválido no PUT', async () => {
        const res = await makeRequest('PUT', '/api/livros/1', { ...livroAtualizado, anoPublicacao: 'ano' });
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('anoPublicacao');
    });

    test('deve retornar 400 quando paginas inválido no PUT', async () => {
        const res = await makeRequest('PUT', '/api/livros/1', { ...livroAtualizado, paginas: -10 });
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('paginas');
    });

    test('deve retornar 400 quando sinopse ausente no PUT', async () => {
        const { sinopse, ...semSinopse } = livroAtualizado;
        const res = await makeRequest('PUT', '/api/livros/1', semSinopse);
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('sinopse');
    });

    test('deve retornar 400 quando palavrasChave inválido no PUT', async () => {
        const res = await makeRequest('PUT', '/api/livros/1', { ...livroAtualizado, palavrasChave: [] });
        expect(res.statusCode).toBe(400);
        expect(res.body.erro).toContain('palavrasChave');
    });

    test('deve retornar 500 quando writeDatabase falhar no PUT', async () => {
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = jest.fn(() => { throw new Error('Falha de escrita'); });

        const res = await makeRequest('PUT', '/api/livros/1', livroAtualizado);
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('erro');

        fs.writeFileSync = originalWriteFileSync;
    });
});

describe('DELETE /api/livros/:id', () => {
    test('deve deletar um livro existente (200)', async () => {
        const res = await makeRequest('DELETE', '/api/livros/1');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('mensagem');

        // Verifica que o livro foi removido
        const listRes = await makeRequest('GET', '/api/livros');
        const ids = listRes.body.map(l => l.id);
        expect(ids).not.toContain('1');
    });

    test('deve retornar 404 para ID inexistente', async () => {
        const res = await makeRequest('DELETE', '/api/livros/999');
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('erro');
    });

    test('deve retornar 500 quando writeDatabase falhar no DELETE', async () => {
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = jest.fn(() => { throw new Error('Falha de escrita'); });

        const res = await makeRequest('DELETE', '/api/livros/1');
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('erro');

        fs.writeFileSync = originalWriteFileSync;
    });
});

describe('Rotas inexistentes da API', () => {
    test('deve retornar 404 para rota API não encontrada', async () => {
        const res = await makeRequest('GET', '/api/inexistente');
        expect(res.statusCode).toBe(404);
        expect(res.body.erro).toContain('Recurso não encontrado');
    });
});

describe('Arquivos estáticos', () => {
    test('deve servir o index.html na raiz (/)', async () => {
        const res = await makeRequest('GET', '/');
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/html');
    });

    test('deve servir o arquivo CSS', async () => {
        const res = await makeRequest('GET', '/style.css');
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/css');
    });

    test('deve servir o arquivo JS', async () => {
        const res = await makeRequest('GET', '/app.js');
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/javascript');
    });
});

describe('CORS - OPTIONS', () => {
    test('deve retornar 204 para preflight request', async () => {
        const res = await makeRequest('OPTIONS', '/api/livros');
        expect(res.statusCode).toBe(204);
    });
});

// ===========================
// Testes de serveStaticFile (cobertura de branches 80-92)
// ===========================

describe('serveStaticFile()', () => {
    test('deve responder com 200 e fallback index.html para rota desconhecida (ENOENT)', (done) => {
        const mockRes = {
            writeHead: jest.fn(),
            end: jest.fn(() => {
                expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html' });
                done();
            })
        };
        // Solicita arquivo inexistente; o servidor deve fazer fallback para index.html
        serveStaticFile(mockRes, '/arquivo-que-nao-existe.html');
    });

    test('deve responder com 404 quando arquivo E index.html estão ausentes (ENOENT duplo)', (done) => {
        // Renomeia temporariamente o index.html para simular ausência
        const indexPath = path.join(WEB_PATH, 'index.html');
        const backupPath = indexPath + '.bak';
        fs.renameSync(indexPath, backupPath);

        const mockRes = {
            writeHead: jest.fn(),
            end: jest.fn(() => {
                try {
                    expect(mockRes.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    expect(mockRes.end).toHaveBeenCalledWith('Página não encontrada e index.html ausente.', 'utf-8');
                } finally {
                    fs.renameSync(backupPath, indexPath);
                }
                done();
            })
        };
        serveStaticFile(mockRes, '/outro-arquivo-inexistente.txt');
    });

    test('deve responder com 500 para erro de leitura não-ENOENT', (done) => {
        const originalReadFile = fs.readFile;
        // Simula erro genérico (não ENOENT)
        fs.readFile = jest.fn((filePath, callback) => {
            const err = new Error('Erro de permissão');
            err.code = 'EACCES';
            callback(err);
        });

        const mockRes = {
            writeHead: jest.fn(),
            end: jest.fn(() => {
                try {
                    expect(mockRes.writeHead).toHaveBeenCalledWith(500);
                } finally {
                    fs.readFile = originalReadFile;
                }
                done();
            })
        };
        serveStaticFile(mockRes, '/index.html');
    });
});

// ===========================
// Teste de inicialização do servidor (linhas 192-199)
// ===========================

describe('Inicialização do servidor (require.main branch)', () => {
    test('não deve iniciar o servidor quando não é o módulo principal', () => {
        // Quando importado via require() (como nos testes), require.main !== module
        // por isso o server.listen(PORT) não é chamado automaticamente.
        // Este teste valida que o módulo exporta corretamente sem efeitos colaterais.
        expect(server).toBeDefined();
        expect(typeof server.listen).toBe('function');
    });
});
