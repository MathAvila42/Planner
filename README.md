# Rotina & Bem-estar

App pessoal de rotina, alimentação e treinos para dois usuários (Monique e Matheus), implementado a partir do design em `design/project/App de Rotina.dc.html` (ver `design/README.md` e `design/chats/chat1.md` para o histórico completo dos requisitos).

- **Frontend**: React + Vite + TypeScript, mobile-first (sem chrome de dispositivo, responsivo até tablet).
- **Backend**: Express + Supabase (Postgres via `@supabase/supabase-js` + Storage para fotos), sessão via cookie assinado (JWT httpOnly). Cada usuário só acessa seus próprios dados. Feito assim (em vez de SQLite em arquivo) porque roda como função serverless na Vercel, cujo sistema de arquivos é somente leitura/efêmero.

## Setup do Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um existente).
2. Rode `server/supabase/schema.sql` em *Project → SQL Editor → New query → Run* (cria as tabelas e habilita RLS).
3. Anote, em *Project Settings → API*: a **Project URL** e a **service_role key** (secreta — nunca vai para o frontend).

## Setup local

```bash
npm install                                # instala as duas apps (workspaces)
cp server/.env.example server/.env         # preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SESSION_SECRET
npm run seed --workspace=server            # popula: Monique com o planner completo, Matheus em branco
```

`SESSION_SECRET` é qualquer string aleatória longa (ex: `openssl rand -hex 32`).

## Rodando em desenvolvimento

Em dois terminais:

```bash
npm run dev:server   # API em http://localhost:4000
npm run dev:web      # app em http://localhost:5173 (proxy para a API)
```

Login com um dos e-mails cadastrados:
- `moniquebeck1996@gmail.com`
- `e.matheus.avila@gmail.com`

## Deploy (Vercel)

Configure as mesmas três variáveis (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`) em *Project Settings → Environment Variables* do projeto Vercel.

## Build de produção (local)

```bash
npm run build:web
npm run build --workspace=server
npm start --workspace=server   # serve a API e os arquivos estáticos do web/dist na mesma porta
```

## Resetar os dados

Apague as linhas das tabelas no Supabase (ou rode `truncate` nelas) e rode `npm run seed --workspace=server` novamente.
