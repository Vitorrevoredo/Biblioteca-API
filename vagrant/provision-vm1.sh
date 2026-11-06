#!/usr/bin/env bash
# ==============================================================================
# provision-vm1.sh — Provisionamento da VM1 (Nó de Controle Ansible + Cliente)
# ==============================================================================
# Responsável por:
#   1. Instalar ferramentas de rede e cliente (curl, wget, git, sshpass)
#   2. Instalar o Ansible e dependências Python (Nó de Controle)
#   3. Gerar e configurar par de chaves SSH para comunicação passwordless com VM2
#   4. Configurar o ambiente do Ansible em /home/vagrant/ansible
# ==============================================================================

set -euo pipefail

echo "============================================================"
echo " [VM1] Provisionamento do Nó de Controle (Ansible + Cliente)"
echo "============================================================"

export DEBIAN_FRONTEND=noninteractive

# 1. Atualizar lista de pacotes
echo "[VM1] Atualizando lista de pacotes..."
apt-get update -y

# 2. Instalar pré-requisitos essenciais
echo "[VM1] Instalando utilitários de rede e ferramentas..."
apt-get install -y \
    curl \
    wget \
    git \
    sshpass \
    software-properties-common \
    python3 \
    python3-pip \
    ca-certificates

# 3. Instalar o Ansible (Nó de Controle)
echo "[VM1] Instalando Ansible..."
if ! command -v ansible &> /dev/null; then
    add-apt-repository --yes --update ppa:ansible/ansible || true
    apt-get update -y
    apt-get install -y ansible
fi

echo "[VM1] Verificando versão do Ansible..."
ansible --version | head -n 2

# 4. Configurar par de chaves SSH para o usuário vagrant
echo "[VM1] Configurando par de chaves SSH para automação..."
SSH_DIR="/home/vagrant/.ssh"
mkdir -p "$SSH_DIR"

if [ ! -f "$SSH_DIR/id_rsa" ]; then
    echo "[VM1] Gerando nova chave SSH RSA 2048 para o usuário vagrant..."
    ssh-keygen -t rsa -b 2048 -f "$SSH_DIR/id_rsa" -N "" -C "ansible-control-node-vm1" -q
fi

chown -R vagrant:vagrant "$SSH_DIR"
chmod 700 "$SSH_DIR"
chmod 600 "$SSH_DIR/id_rsa"
chmod 644 "$SSH_DIR/id_rsa.pub"

# Compartilhar a chave pública com a VM2 através de diretório compartilhado
KEYS_DIR="/vagrant_data/.keys"
mkdir -p "$KEYS_DIR" 2>/dev/null || KEYS_DIR="/tmp/.keys"
mkdir -p "$KEYS_DIR" 2>/dev/null || true
cp "$SSH_DIR/id_rsa.pub" "$KEYS_DIR/vm1_id_rsa.pub" 2>/dev/null || true

# Configurar SSH client para desativar checagem estrita de host key para a sub-rede privada
cat > /home/vagrant/.ssh/config << 'EOF'
Host 192.168.56.*
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR
EOF
chown vagrant:vagrant /home/vagrant/.ssh/config
chmod 600 /home/vagrant/.ssh/config

# 5. Garantir que os arquivos do Ansible estejam prontos em /home/vagrant/ansible
echo "[VM1] Configurando diretório do Ansible..."
if [ -d "/vagrant_data/ansible" ] && [ ! -d "/home/vagrant/ansible" ]; then
    cp -r /vagrant_data/ansible /home/vagrant/ansible
fi

if [ -d "/home/vagrant/ansible" ]; then
    chown -R vagrant:vagrant /home/vagrant/ansible
fi

echo "============================================================"
echo " [VM1] Nó de Controle provisionado com sucesso!"
echo " Ferramentas instaladas: curl, wget, git, python3, ansible"
echo " Chave SSH gerada em: /home/vagrant/.ssh/id_rsa"
echo " Arquivos Ansible em: /home/vagrant/ansible"
echo "============================================================"
