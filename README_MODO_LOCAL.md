# 🚀 Guia de Execução Local & Offline do CRM

Este CRM foi arquitetado para funcionar **100% no seu computador (localmente)**, com banco de dados próprio na sua máquina e **sem necessidade de conexão com a internet**.

---

## 🔒 Onde ficam os meus dados?
Todos os seus dados estão salvos na pasta **`./data/`** dentro do projeto:
- `leads.json`: Todos os leads, histórico de contatos, valores e anotações
- `company.json`: Perfil da sua empresa, telefone, CNPJ e moeda
- `stages.json`: Etapas personalizadas dos funis de vendas
- `templates.json`: Modelos de mensagens do WhatsApp
- `custom_fields.json`: Campos personalizados criados por você
- `ads_campaigns.json`: Campanhas e métricas de anúncios (ADS)
- `shortened_urls.json`: Links encurtados locais e contagem de cliques
- `auth.json`: Login e senha de segurança

> **Privacidade Total:** 0% dos seus dados são enviados para servidores externos ou nuvens de terceiros. Fica tudo no disco rígido da sua máquina.

---

## ⚡ Como Rodar no Seu Computador (Passo a Passo)

### 1. Pré-requisito Único:
Instale o **Node.js** (versão recomendada LTS):
👉 [https://nodejs.org/](https://nodejs.org/) *(instalação rápida com Avançar/Next)*

---

### 2. No Windows (1 Clique):
Basta dar um **duplo clique no arquivo**:
```
iniciar-crm-windows.bat
```
- Ele verificará o Node.js.
- Instalará as dependências automaticamente na primeira vez.
- Abrirá automaticamente o seu navegador em **`http://localhost:3000`**.

---

### 3. No Mac ou Linux:
Abra o terminal na pasta do projeto e execute:
```bash
chmod +x iniciar-crm-linux-mac.sh
./iniciar-crm-linux-mac.sh
```
Ou manualmente:
```bash
npm install
npm run dev
```
E acesse no navegador: **`http://localhost:3000`**.

---

## 💾 Backups e Restauração
Dentro do próprio sistema, acesse:
**Menu Lateral > Configurações > Aba "Banco de Dados & Modo Local"**:
- **Baixar Backup Completo (ZIP):** Salva uma cópia de todos os arquivos de dados com 1 clique.
- **Exportar Excel/CSV:** Exporta a planilha completa de leads.
- **Exportar Dump JSON:** Gera um arquivo com todo o banco de dados.
- **Restaurar Banco de Dados:** Envia um arquivo de backup para restaurar tudo instantaneamente caso troque de computador.

---

## 📴 Funciona sem Internet?
**SIM! 100% OFFLINE:**
- Gestão completa de leads, contatos e funil Kanban.
- Gerador e editor de modelos de WhatsApp.
- Rastreamento de anúncios e encurtador de links local (`/s/:codigo`).
- Geração de QR Code instantânea e offline (sem chamadas a servidores de terceiros).
- Exportação de planilhas CSV e backups.
