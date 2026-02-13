# Starecruiter — Caça Talentos (StarMKT)

MVP sem LLM: busca baseada em **Google Programmable Search (Custom Search JSON API)** com **quota diária** (padrão: 100 queries/dia) e **lock** quando a quota esgota.

## Arquitetura

- **Front (Vite/React)**: roda em `http://localhost:3000`
- **Server (Express)**: proxy seguro para o Google CSE + controle de quota em `http://localhost:8787`

> A chave do Google **fica somente no backend**.

## Como rodar

### 1) Front
```bash
npm install
npm run dev
```

### 2) Backend
```bash
cd server
npm install
cp .env.example .env   # edite com suas chaves
npm run dev
```

## Variáveis do backend

Crie `server/.env` com:

- `GOOGLE_CSE_API_KEY` — API key do Google
- `GOOGLE_CSE_CX` — Search Engine ID (cx)
- `DAILY_QUERY_LIMIT` — (opcional) padrão 100
- `PORT` — (opcional) padrão 8787

## Quota / Lock

- O app mostra `restantes/limite` no topo.
- Quando restarem **5** ou menos, aparece alerta.
- Quando esgotar, o app fica **travado** até o reset do dia (basta recarregar após virar o dia).
