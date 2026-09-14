#!/usr/bin/env bash

echo "====================================================================="
echo "      CRM COMERCIAL & FUNIL DE VENDAS - EXECUTOR LOCAL (OFFLINE)"
echo "====================================================================="
echo ""
echo "[*] Verificando ambiente na sua máquina..."

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não foi encontrado!"
    echo "Por favor instale o Node.js v18 ou superior: https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js detectado: $(node -v)"

# Verifica dependências
if [ ! -d "node_modules" ]; then
    echo "[*] Primeira execução: Instalando pacotes com 'npm install'..."
    npm install
fi

# Cria pasta data se não existir
mkdir -p data

echo ""
echo "====================================================================="
echo "[✓] Banco de dados local: pasta ./data/"
echo "[✓] Modo 100% offline ativo"
echo "[✓] Iniciando CRM em http://localhost:3000..."
echo "====================================================================="
echo ""

# Tenta abrir o navegador automaticamente
if command -v xdg-open &> /dev/null; then
    (sleep 3 && xdg-open "http://localhost:3000") &
elif command -v open &> /dev/null; then
    (sleep 3 && open "http://localhost:3000") &
fi

npm run dev
