#!/usr/bin/env bash
# ============================================
# provision-vm1.sh — Provisionamento da VM1 (Cliente)
# ============================================
# Instala o curl para realizar requisições HTTP
# à API hospedada na VM2 (192.168.56.11:8080).
# ============================================

set -euo pipefail

echo "=========================================="
echo " VM1 — Provisionamento do Cliente"
echo "=========================================="

# 1. Atualizar lista de pacotes
echo "[VM1] Atualizando lista de pacotes..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y

# 2. Instalar o curl
echo "[VM1] Instalando curl..."
apt-get install -y curl

# 3. Verificar instalação do curl
echo "[VM1] Verificando instalação do curl..."
if command -v curl &> /dev/null; then
    echo "[VM1] curl instalado com sucesso: $(curl --version | head -1)"
else
    echo "[VM1] ERRO: curl não foi instalado corretamente!"
    exit 1
fi

echo "=========================================="
echo " VM1 — Provisionamento concluído!"
echo " Use: curl http://192.168.56.11:8080/api/livros"
echo "=========================================="

