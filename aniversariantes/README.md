# 🎂 Aniversariantes App

App PWA (Progressive Web App) para gerenciar aniversariantes com notificações, banco de dados local e funciona offline.

## ✨ Funcionalidades

- 📋 **65 contatos** importados da planilha original
- 🎉 **Banner de aniversariante do dia** com destaque especial
- 🔔 **Notificações** do navegador para avisar no dia do aniversário
- 📅 **Filtros** por mês, próximos 30 dias, sem data
- 🔍 **Busca** por nome ou telefone
- ✏️ **Editar / Adicionar / Excluir** contatos (salva automaticamente)
- 💾 **Banco de dados local** (localStorage) — sem servidor, funciona offline
- 📤 **Exportar** CSV ou JSON
- 📥 **Importar** CSV ou JSON
- 📱 **Instalável** como app no celular (PWA)
- 🌙 **Modo escuro** automático

---

## 🚀 Como colocar no GitHub e acessar no celular

### Passo 1 — Criar conta no GitHub
Acesse [github.com](https://github.com) e crie uma conta gratuita se ainda não tiver.

### Passo 2 — Criar um repositório novo

1. Clique em **"New"** ou **"+"** → **"New repository"**
2. Nome do repositório: `aniversariantes` (ou qualquer nome)
3. Deixe como **Public**
4. Clique em **"Create repository"**

### Passo 3 — Fazer upload dos arquivos

**Opção A — Direto pelo GitHub (mais fácil, sem instalar nada):**

1. No repositório criado, clique em **"uploading an existing file"**
2. Arraste TODOS os arquivos e pastas desta pasta para a área de upload:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - pasta `css/` (com `style.css`)
   - pasta `js/` (com `app.js` e `data.js`)
   - pasta `icons/` (com os ícones)
3. Clique em **"Commit changes"**

**Opção B — Via Git (terminal):**
```bash
cd aniversariantes
git init
git add .
git commit -m "Primeiro commit - App Aniversariantes"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/aniversariantes.git
git push -u origin main
```

### Passo 4 — Ativar GitHub Pages

1. No repositório, vá em **Settings** (aba no topo)
2. No menu lateral, clique em **"Pages"**
3. Em **"Source"**, selecione **"Deploy from a branch"**
4. Branch: **`main`** / Folder: **`/ (root)`**
5. Clique em **"Save"**

Aguarde ~2 minutos e o link aparecerá:
```
https://SEU_USUARIO.github.io/aniversariantes/
```

### Passo 5 — Instalar no celular

**Android (Chrome):**
1. Abra o link no Chrome
2. Toque no menu (⋮) → **"Adicionar à tela inicial"**
3. O app aparece como ícone na tela inicial!

**iPhone (Safari):**
1. Abra o link no Safari
2. Toque no botão de compartilhar (□↑)
3. Toque em **"Adicionar à Tela de Início"**

---

## 📁 Estrutura de arquivos

```
aniversariantes/
├── index.html          ← Página principal do app
├── manifest.json       ← Configurações do PWA
├── sw.js               ← Service Worker (offline)
├── css/
│   └── style.css       ← Estilos do app
├── js/
│   ├── data.js         ← Dados iniciais da planilha
│   └── app.js          ← Lógica do aplicativo
└── icons/
    ├── icon-192.png    ← Ícone do app
    └── icon-512.png    ← Ícone grande
```

---

## 💡 Dicas de uso

- **Notificações:** Ative na barra verde dentro do app para receber avisos às 8h dos aniversários
- **Backup:** Use "Exportar CSV" para salvar uma cópia dos dados
- **Atualizar contatos:** Toque em qualquer pessoa para editar
- **Adicionar:** Botão **+** no canto inferior direito
- **Filtrar por mês:** Use os botões de mês na barra de filtros

---

## 🔒 Privacidade

Todos os dados ficam **apenas no seu dispositivo** (localStorage do navegador). Nada é enviado para servidores.

---

Feito com ❤️ — baseado na planilha ANIVERSARIANTES_2.xlsm
