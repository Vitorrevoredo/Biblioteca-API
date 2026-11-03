#!/usr/bin/env bash
# ============================================
# provision-vm2.sh — Provisionamento da VM2 (Servidor)
# ============================================
# Instala o Node.js 20.x, configura a aplicação
# Biblioteca API e cria um serviço systemd para
# mantê-la em execução contínua na porta 8080.
# ============================================

set -euo pipefail

echo "=========================================="
echo " VM2 — Provisionamento do Servidor"
echo "=========================================="

# ============================================
# 1. Atualizar pacotes do sistema
# ============================================
echo "[VM2] Atualizando lista de pacotes..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y

# ============================================
# 2. Instalar dependências básicas para o setup do repositório Node.js
# ============================================
echo "[VM2] Instalando dependências de pré-requisito..."
apt-get install -y ca-certificates curl gnupg

# ============================================
# 3. Instalar Node.js 20.x (mesma versão do Dockerfile)
# ============================================
echo "[VM2] Configurando repositório NodeSource para Node.js 20.x..."

# Criar diretório para a chave GPG
mkdir -p /etc/apt/keyrings

# Baixar e instalar a chave GPG do NodeSource
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Adicionar o repositório do NodeSource para Node.js 20
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

# Atualizar pacotes com o novo repositório e instalar Node.js
apt-get update -y
apt-get install -y nodejs

# ============================================
# 4. Verificar instalação do Node.js e npm
# ============================================
echo "[VM2] Verificando Node.js e npm..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "[VM2] Node.js: $NODE_VERSION"
echo "[VM2] npm: $NPM_VERSION"

# ============================================
# 5. Verificar se a pasta compartilhada está disponível
# ============================================
echo "[VM2] Verificando pasta compartilhada /vagrant_data..."
if [ ! -d "/vagrant_data" ]; then
    echo "[VM2] ERRO: Pasta compartilhada /vagrant_data não encontrada!"
    exit 1
fi

if [ ! -f "/vagrant_data/src/server.js" ]; then
    echo "[VM2] ERRO: Arquivo src/server.js não encontrado em /vagrant_data!"
    exit 1
fi
echo "[VM2] Pasta compartilhada verificada com sucesso."

# ============================================
# 6. Instalar dependências de produção (se existirem)
# ============================================
echo "[VM2] Verificando dependências de produção..."
cd /vagrant_data

if [ -f "package.json" ]; then
    # Verificar se existem dependências de produção no package.json
    HAS_DEPS=$(node -e "
        const pkg = require('./package.json');
        const deps = pkg.dependencies || {};
        console.log(Object.keys(deps).length > 0 ? 'true' : 'false');
    ")

    if [ "$HAS_DEPS" = "true" ]; then
        echo "[VM2] Instalando dependências de produção..."
        npm ci --omit=dev --ignore-scripts
    else
        echo "[VM2] Nenhuma dependência de produção encontrada. Prosseguindo sem npm install."
    fi
else
    echo "[VM2] AVISO: package.json não encontrado."
fi

# ============================================
# 7. Verificar permissões do database.json
# ============================================
echo "[VM2] Verificando permissões do banco de dados..."
DB_FILE="/vagrant_data/src/database.json"
if [ -f "$DB_FILE" ]; then
    chmod 664 "$DB_FILE" 2>/dev/null || echo "[VM2] AVISO: Não foi possível alterar permissões de database.json (pode ser limitação do synced folder)."
    echo "[VM2] database.json acessível."
else
    echo "[VM2] AVISO: database.json não encontrado. A aplicação criará um novo se necessário."
fi

# ============================================
# 8. Criar serviço systemd para a Biblioteca API
# ============================================
echo "[VM2] Criando serviço systemd biblioteca-api.service..."

cat > /etc/systemd/system/biblioteca-api.service << 'EOF'
[Unit]
Description=Biblioteca API - Servidor REST Node.js
Documentation=https://github.com/devsilvafelipe/biblioteca-api
After=network.target vagrant.mount

[Service]
Type=simple
WorkingDirectory=/vagrant_data
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=biblioteca-api

# Variáveis de ambiente
Environment=NODE_ENV=production
Environment=PORT=8080

# Segurança — executa como usuário vagrant (dono dos arquivos compartilhados)
User=vagrant
Group=vagrant

[Install]
WantedBy=multi-user.target
EOF

# ============================================
# 9. Habilitar e iniciar o serviço
# ============================================
echo "[VM2] Habilitando e iniciando o serviço biblioteca-api..."
systemctl daemon-reload
systemctl enable biblioteca-api.service
systemctl start biblioteca-api.service

# Aguardar o servidor inicializar
echo "[VM2] Aguardando o servidor iniciar..."
sleep 3

# ============================================
# 10. Verificar se o serviço está rodando
# ============================================
echo "[VM2] Verificando status do serviço..."
if systemctl is-active --quiet biblioteca-api.service; then
    echo "[VM2] Serviço biblioteca-api está ATIVO e rodando!"
else
    echo "[VM2] AVISO: Serviço biblioteca-api pode não ter iniciado corretamente."
    echo "[VM2] Verificar logs com: sudo journalctl -u biblioteca-api -n 20"
fi

# Teste local rápido
echo "[VM2] Testando API localmente..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/livros 2>/dev/null || echo "000")
if [ "$RESPONSE" = "200" ]; then
    echo "[VM2] API respondendo com HTTP 200 na porta 8080!"
else
    echo "[VM2] AVISO: API retornou HTTP $RESPONSE. Verifique os logs."
fi

echo "=========================================="
echo " VM2 — Provisionamento concluído!"
echo " API disponível em: http://192.168.56.11:8080/api/livros"
echo " Status: sudo systemctl status biblioteca-api"
echo " Logs:   sudo journalctl -u biblioteca-api -f"
echo "=========================================="

