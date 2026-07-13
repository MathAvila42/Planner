# Rotina & Bem-estar

App pessoal de rotina, alimentação e treinos para dois usuários (Monique e Matheus), implementado a partir do design em `design/project/App de Rotina.dc.html` (ver `design/README.md` e `design/chats/chat1.md` para o histórico completo dos requisitos).

- **Frontend**: React + Vite + TypeScript, mobile-first (sem chrome de dispositivo, responsivo até tablet).
- **Backend**: Express + SQLite (`better-sqlite3`), com sessão via cookie assinado (JWT httpOnly). Cada usuário só acessa seus próprios dados.
- **Fotos** de exercícios/alongamentos/core: upload salvo em `server/uploads/`, servido em `/uploads/...`.

## Setup

```bash
npm install                     # instala as duas apps (workspaces)
npm run seed --workspace=server # popula o banco: Monique com o planner completo, Matheus em branco
```

## Rodando em desenvolvimento

Em dois terminais:

```bash
npm run dev:server   # API em http://localhost:4000
npm run dev:web      # app em http://localhost:5173 (proxy para a API)
```

Login com um dos e-mails cadastrados:
- `moniquebeck1996@gmail.com`
- `e.matheus.avila@gmail.com`

## Build de produção

```bash
npm run build:web
npm run build --workspace=server
npm start --workspace=server   # serve a API e os arquivos estáticos do web/dist na mesma porta
```

## Resetar os dados

Apague `server/data/app.sqlite*` e rode `npm run seed --workspace=server` novamente.
