# Taiwan Basketball Backend

Node.js + Express backend with PostgreSQL.

## Requirements

- Node.js 18+
- PostgreSQL 14+ or Docker

## Setup

```bash
npm install
copy .env.example .env
```

If you want a local database with Docker:

```bash
docker compose up -d
```

The Docker database is exposed on host port `5433` to avoid conflicts with any local PostgreSQL already using `5432`.

Run database migrations:

```bash
npm run db:create
npm run db:migrate
```

Optional seed data:

```bash
npm run db:seed
```

Start the API:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

## Endpoints

```text
GET    /api/health

GET    /api/teams
GET    /api/teams/:id
POST   /api/teams
PATCH  /api/teams/:id
DELETE /api/teams/:id

GET    /api/schedule

GET    /api/games
GET    /api/games/:id
POST   /api/games
PATCH  /api/games/:id
DELETE /api/games/:id
```

Useful read endpoints for the frontend:

```text
GET /api/teams?leagueCode=PLG
GET /api/schedule?leagueCode=PLG&season=2025-26
GET /api/schedule?leagueCode=PLG&season=2025-26&stage=regular_season
GET /api/schedule?leagueCode=PLG&season=2025-26&stage=playoffs
```

## Example requests

Create a team:

```bash
curl -X POST http://localhost:3000/api/teams ^
  -H "Content-Type: application/json" ^
  -d "{\"league\":\"PLG\",\"name\":\"Taipei Fubon Braves\",\"city\":\"Taipei\",\"abbreviation\":\"TFB\"}"
```

Create a game:

```bash
curl -X POST http://localhost:3000/api/games ^
  -H "Content-Type: application/json" ^
  -d "{\"league\":\"PLG\",\"season\":\"2025-26\",\"gameDate\":\"2026-01-10T11:00:00.000Z\",\"homeTeamId\":1,\"awayTeamId\":2,\"venue\":\"Taipei Heping Basketball Gymnasium\"}"
```
