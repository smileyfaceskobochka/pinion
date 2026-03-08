# 🪶 Pinion

A modern, self-hosted game server management panel built in Rust — a clean replacement for the PHP-based Pelican/Pterodactyl panel.

Pinion is the control plane only. All actual server lifecycle management is delegated to [Wings](https://github.com/pelican-dev/wings), the battle-tested Go daemon that Pelican/Pterodactyl already use. Pinion replaces the Laravel panel with a fast, minimal Rust + TypeScript stack.

---

## Why

Pelican Panel works. It's also 80,000 lines of PHP, Laravel, and Blade templates. Pinion exists because:

- No PHP runtime on the server
- No Node.js build pipeline baked into the backend
- Proper async I/O throughout (Tokio + Axum)
- A codebase you can actually read and modify
- First-class WebSocket support for real-time console streaming

---

## Architecture

```
Browser / CLI
     │
     ▼
┌─────────────────────────────┐
│      Caddy (reverse proxy)  │
│  /api/* /ws/*  →  Axum      │
│  /*            →  Vite/SPA  │
└──────────────┬──────────────┘
               │
     ┌─────────▼──────────┐
     │   pinion-api        │   Axum HTTP + WebSocket server
     │   (Rust binary)     │
     └──┬──────────────┬───┘
        │              │
   ┌────▼────┐   ┌─────▼──────┐
   │Postgres │   │   Redis     │
   │  SQLx   │   │  (cache)    │
   └─────────┘   └────────────┘
        │
        ▼
   Wings HTTP API        ← Go daemon, reused as-is
   ┌─────────────┐  ┌─────────────┐
   │ wings@node1 │  │ wings@node2 │
   │  Docker     │  │  Docker     │
   │  ├─ mc-1    │  │  ├─ mc-3    │
   │  └─ mc-2    │  │  └─ valheim │
   └─────────────┘  └─────────────┘
```

The WebSocket console proxy is the key piece: Wings streams console output and resource stats over WebSocket, authenticated via short-lived JWTs that Pinion issues and refreshes transparently.

---

## Crate Structure

```
crates/
├── pinion-core      Domain types, error types, permission bitflags — no I/O
├── pinion-db        SQLx repository layer, Postgres migrations
├── pinion-wings     Wings REST client + WebSocket proxy + JWT issuance
└── pinion-api       Axum binary — routes, middleware, AppState
```

Each crate has a single clear responsibility. `pinion-core` has zero I/O dependencies and can be tested in isolation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| HTTP server | [Axum](https://github.com/tokio-rs/axum) 0.7 |
| Async runtime | [Tokio](https://tokio.rs) 1 |
| Database | PostgreSQL via [SQLx](https://github.com/launchbadge/sqlx) 0.7 |
| Cache | Redis |
| Wings client | [reqwest](https://github.com/seanmonstar/reqwest) + [tokio-tungstenite](https://github.com/snapview/tokio-tungstenite) |
| Auth | Argon2 passwords, JWT sessions ([jsonwebtoken](https://github.com/Keats/jsonwebtoken)) |
| Reverse proxy | [Caddy](https://caddyserver.com) |
| Frontend | TypeScript + React + Vite |
| Containerization | Docker + Compose |

---

## Prerequisites

- Rust 1.80+
- Docker + Docker Compose
- A running [Wings](https://github.com/pelican-dev/wings) instance (see Wings docs for node setup)
- PostgreSQL 16 (or use the provided Compose file)

---

## Getting Started

### 1. Clone and configure

```bash
git clone https://github.com/yourname/pinion
cd pinion
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET:
openssl rand -hex 64
```

### 2. Start the stack

```bash
docker compose up -d
```

This starts Pinion API, PostgreSQL, and Redis. Caddy is expected to run on the host pointing at the Compose network.

### 3. Run migrations

```bash
cargo run --bin pinion -- migrate
```

### 4. Register your Wings node

In Pinion's admin UI (or via API), add a node with:
- FQDN of the machine running Wings
- The `token` value from `/etc/pelican/config.yml` on that machine
- Allocated memory and disk

Wings will start accepting requests from Pinion immediately — no restart needed.

### 5. Import eggs

```bash
# Import bundled Minecraft eggs
cargo run --bin pinion -- eggs import ./eggs/
```

Or import any Pelican-compatible egg JSON through the admin UI.

---

## Development

```bash
# Check the workspace
cargo check

# Run tests
cargo test

# Run with hot-reload (requires cargo-watch)
cargo watch -x 'run --bin pinion'

# Frontend dev server
cd frontend && npm install && npm run dev
```

The Caddyfile in the repo root is configured for `pinion.local` with `tls internal` (Caddy's local CA). Add it to `/etc/hosts` or configure your local DNS.

---

## Wings Compatibility

Pinion targets the Wings API exposed by [pelican-dev/wings](https://github.com/pelican-dev/wings). The original [pterodactyl/wings](https://github.com/pterodactyl/wings) should also work — the API surface is identical.

Pinion does **not** ship its own daemon. If you want to manage servers, you need Wings running on each node.

---

## License

MIT