#!/usr/bin/env bash
# ==============================================================================
# provision-vm2.sh — Provisionamento da VM2 (Managed Node / Servidor de Aplicação)
# ==============================================================================
# Responsável por:
#   1. Atualizar pacotes do sistema
#   2. Instalar dependências básicas, Python 3 (essencial para o Ansible) e Git
#   3. Configurar SSH para aceitar conexões remotas do Nó de Controle (VM1)
#   4. Instalar Node.js 20.x e preparar o ambiente de execução da aplicação
#   5. Configurar serviço systemd para a Biblioteca API
# ==============================================================================

set -euo pipefail

echo "============================================================"
echo " [VM2] Provisionamento do Nó de Aplicação (Servidor)"
echo "============================================================"

export DEBIAN_FRONTEND=noninteractive

# ==============================================================================
# 1. Atualizar pacotes do sistema
# ==============================================================================
echo "[VM2] Atualizando lista de pacotes..."
apt-get update -y

# ==============================================================================
# 2. Instalar dependências de sistema (Python 3 para Ansible, curl, git, etc.)
# ==============================================================================
echo "[VM2] Instalando dependências de sistema..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    git \
    python3 \
    python3-apt \
    python3-pip \
    build-essential

# ==============================================================================
# 3. Configurar SSH para receber conexões do Nó de Controle (VM1)
# ==============================================================================
echo "[VM2] Configurando chaves SSH autorizadas..."
SSH_DIR="/home/vagrant/.ssh"
mkdir -p "$SSH_DIR"
touch "$SSH_DIR/authorized_keys"

# Autorizar a chave pública da VM1 se já gerada
KEYS_DIR="/vagrant_data/.keys"
if [ -f "$KEYS_DIR/vm1_id_rsa.pub" ]; then
    echo "[VM2] Adicionando chave pública do Nó de Controle (VM1)..."
    cat "$KEYS_DIR/vm1_id_rsa.pub" >> "$SSH_DIR/authorized_keys"
fi

# Ajustar permissões seguras do SSH
chown -R vagrant:vagrant "$SSH_DIR"
chmod 700 "$SSH_DIR"
chmod 600 "$SSH_DIR/authorized_keys"

# Garantir que autenticação por senha e por chave pública estejam ativas
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null || true
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null || true
systemctl restart ssh 2>/dev/null || systemctl restart sshd 2>/dev/null || true

# ==============================================================================
# 4. Instalar Node.js 20.x (Runtime oficial)
# ==============================================================================
echo "[VM2] Configurando repositório NodeSource para Node.js 20.x..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg

NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

apt-get update -y
apt-get install -y nodejs

echo "[VM2] Versões instaladas: Node.js $(node --version), npm $(npm --version)"

# ==============================================================================
# 5. Verificar pasta compartilhada /vagrant_data
# ==============================================================================
echo "[VM2] Verificando pasta compartilhada /vagrant_data..."
if [ -d "/vagrant_data" ]; then
    echo "[VM2] Pasta compartilhada /vagrant_data montada com sucesso."
fi

# ==============================================================================
# 6. Criar serviço systemd biblioteca-api.service
# ==============================================================================
# Nota: Este serviço executa a aplicação tanto a partir de /vagrant_data
# quanto permite que o Ansible reconfigure para /opt/biblioteca-api de forma idempotente.
# ==============================================================================
echo "[VM2] Configurando serviço systemd inicial..."

APP_DIR="/vagrant_data"
if [ ! -f "$APP_DIR/src/server.js" ] && [ -d "/opt/biblioteca-api" ]; then
    APP_DIR="/opt/biblioteca-api"
fi

cat > /etc/systemd/system/biblioteca-api.service << EOF
[Unit]
Description=Biblioteca API - Servidor REST Node.js
Documentation=https://github.com/Vitorrevoredo/Biblioteca-API
After=network.target vagrant.mount

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=biblioteca-api

Environment=NODE_ENV=production
Environment=PORT=8080

User=vagrant
Group=vagrant

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable biblioteca-api.service
systemctl restart biblioteca-api.service || true

echo "============================================================"
echo " [VM2] Nó de Aplicação provisionado com sucesso!"
echo " IP Privado: 192.168.56.11"
echo " Pronto para ser gerenciado pelo Nó de Controle (VM1) via Ansible"
echo "============================================================"
