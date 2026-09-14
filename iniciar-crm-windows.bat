@echo off
chcp 65001 >nul
title CRM Comercial & Funil de Vendas - Modo Local (100%% Offline)
color 0A

echo =====================================================================
echo       CRM COMERCIAL & FUNIL DE VENDAS - EXECUTOR LOCAL (OFFLINE)
echo =====================================================================
echo.
echo [*] Verificando ambiente na sua maquina...

:: Verifica se o Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO CRITICO] O Node.js nao foi encontrado no seu computador!
    echo.
    echo Para executar o CRM offline na sua maquina, instale o Node.js:
    echo 1. Baixe a versao recomendada (LTS) em: https://nodejs.org/
    echo 2. Instale normalmente com as opcoes padrao.
    echo 3. Execute este arquivo iniciar-crm-windows.bat novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado com sucesso:
node -v

:: Verifica se node_modules existe
if not exist "node_modules\" (
    echo.
    echo [*] Primeira execucao detectada! Instalando dependencias locais...
    echo     (Isso precisa ser feito apenas uma vez)
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERRO] Falha ao instalar dependencias com npm install.
        pause
        exit /b 1
    )
)

:: Garante que a pasta de dados local existe
if not exist "data\" (
    mkdir "data"
)

echo.
echo =====================================================================
echo [V] Banco de dados local: pasta ./data/
echo [V] Modo offline pronto: 100%% independente de conexao externa!
echo [V] Iniciando servidor do CRM na porta 3000...
echo =====================================================================
echo.
echo Abra o navegador no endereco: http://localhost:3000
echo.

:: Abre o navegador automaticamente apos 3 segundos
start "" timeout /t 3 /nobreak >nul & start http://localhost:3000

:: Inicia a aplicacao
npm run dev

pause
