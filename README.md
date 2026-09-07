# Urucuí Sports

Portal esportivo do futebol urucuiense — notícias, classificações, jogos, transmissões ao vivo e galeria de fotos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Linguagem | TypeScript 5 |
| Banco de dados | PostgreSQL 16 + Drizzle ORM |
| Estilização | Tailwind CSS v4 |
| Autenticação | JWT (jose) + Refresh Tokens + bcryptjs |
| Validação | Zod |
| Testes | Vitest |
| Monitoramento | Sentry |
| Infra | Docker + Docker Compose |
| CI | GitHub Actions |

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 (ou Docker)

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/Lucier/urucuisports.git
cd urucuisports

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Execute as migrações
pnpm db:migrate

# 5. (Opcional) Popule o banco com dados de exemplo
pnpm db:seed

# 6. Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `JWT_SECRET` | Segredo para assinatura JWT (mín. 32 bytes) |
| `NEXT_PUBLIC_API_URL` | URL pública da aplicação (sem barra final) |
| `SENTRY_DSN` | DSN do Sentry (servidor) — opcional |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN do Sentry (cliente) — opcional |
| `SENTRY_ORG` | Organização no Sentry — opcional |
| `SENTRY_PROJECT` | Projeto no Sentry — opcional |
| `SENTRY_AUTH_TOKEN` | Token para upload de source maps — opcional |

Gere o `JWT_SECRET` com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts

```bash
pnpm dev           # Servidor de desenvolvimento (Turbopack)
pnpm build         # Build de produção
pnpm start         # Inicia o servidor de produção
pnpm lint          # ESLint
pnpm type-check    # TypeScript sem emitir arquivos
pnpm test          # Testes unitários (Vitest)
pnpm test:coverage # Cobertura de testes

pnpm db:generate   # Gera nova migração a partir do schema
pnpm db:migrate    # Executa migrações pendentes
pnpm db:studio     # Abre o Drizzle Studio (UI visual do banco)
pnpm db:seed       # Popula o banco com dados de exemplo
```

## Deploy com Docker

```bash
# Copie e configure o arquivo de ambiente
cp .env.example .env
# Edite .env com DB_PASSWORD, JWT_SECRET e NEXT_PUBLIC_API_URL

# Suba todos os serviços (app + postgres + backup automático)
docker compose up -d
```

A aplicação ficará disponível em `http://localhost:3000`.

O serviço `db-backup` gera backups diários comprimidos em `./backups/` e remove automaticamente os arquivos com mais de 7 dias.

## Estrutura do projeto

```
src/
├── app/                   # Rotas e páginas (App Router)
│   ├── admin/             # Painel administrativo (protegido)
│   ├── api/               # API Routes (auth, health)
│   ├── estatisticas/      # Classificação e artilharia por liga
│   ├── fotos/             # Galeria de fotos
│   ├── noticias/          # Listagem e detalhe de notícias
│   └── transmissoes/      # Transmissões ao vivo
├── components/            # Componentes reutilizáveis
│   ├── admin/             # Componentes do painel admin
│   ├── home/              # Seções da página inicial
│   ├── layout/            # Navbar, Footer
│   └── ui/                # Componentes genéricos (SafeImage, etc.)
├── database/
│   ├── schema.ts          # Definição de todas as tabelas
│   ├── migrations/        # Migrações SQL geradas pelo Drizzle
│   └── seed.ts            # Dados de exemplo
├── lib/                   # Utilitários do servidor (auth, jwt, rate-limit)
├── modules/               # Módulos de domínio (auth, users)
├── shared/                # Tipos e utilitários compartilhados
└── tests/                 # Testes unitários
```

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários e administradores |
| `refresh_tokens` | Tokens de refresh com rotação e revogação |
| `leagues` | Ligas e torneios |
| `rounds` | Rodadas de cada liga |
| `matches` | Partidas com placar e status |
| `standings` | Tabela de classificação |
| `top_scorers` | Artilharia |
| `teams` | Times participantes |
| `players` | Jogadores vinculados a times |
| `posts` | Notícias com soft delete |
| `categories` | Categorias de notícias |
| `streams` | Transmissões ao vivo (YouTube) |
| `photo_albums` | Álbuns de fotos |
| `advertisers` | Anunciantes exibidos na home |

## Autenticação

- Access token JWT com expiração de **1 hora** (cookie `httpOnly`)
- Refresh token de **7 dias** com rotação a cada uso (hash SHA-256 no banco)
- O componente `SessionKeepAlive` renova o access token automaticamente 5 minutos antes do vencimento, sem interromper a sessão do administrador

## CI/CD

O pipeline do GitHub Actions (`.github/workflows/ci.yml`) executa em cada push/PR:

1. **lint-typecheck** — ESLint + `tsc --noEmit`
2. **test** — Vitest
3. **build** — `next build` (depende dos dois jobs anteriores)
