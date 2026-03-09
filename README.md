# 🪶 Pinion

<img
  style="display: block; 
    margin-left: auto;
    margin-right: auto;
    width: 90%;"
  src="https://private-user-images.githubusercontent.com/101476002/560359432-8b3c42cf-afd2-4bd5-b0b0-6ee7d73fcb2a.svg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzMwNjc2ODUsIm5iZiI6MTc3MzA2NzM4NSwicGF0aCI6Ii8xMDE0NzYwMDIvNTYwMzU5NDMyLThiM2M0MmNmLWFmZDItNGJkNS1iMGIwLTZlZTdkNzNmY2IyYS5zdmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMzA5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDMwOVQxNDQzMDVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT05OTczMzVkN2E1OWM4ZmU5OTM4MzU0ZjM2NWUwOWFmZGZkMGZkOThhNGRiNDlkZmFjMGFjZDFlMmQ1YWE0NDFjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.ifYZWqGMNG99LgzJpMrklbe2b0WBEQpAVgYqt5Y2Cfg" alt="Pinion banner">

A game server panel not using PHP. That's it. That's the pitch.

It's a Rust rewrite of [Pelican Panel](https://github.com/pelican-dev/panel) that delegates all the actual work to [Wings](https://github.com/pelican-dev/wings) — the Go daemon Pelican already uses — while replacing the Laravel backend with Axum and the stylish frontend in Preact.

---

## That's cool but why?

Pelican works great!

Pinion is the same thing but in Rust. Yes, this is a meme. No, it didn't stop me.

---

## What's Inside

```
crates/
├── pinion-core   domain types and errors — zero io, very boring, very important
├── pinion-db     SQLx repos and Postgres migrations
├── pinion-wings  Wings REST + WebSocket client, JWT issuance
└── pinion-api    Axum HTTP server, the thing you actually run
frontend          Preact + Vite + TanStack Router + xterm.js, powered by Bun
```

---

## Prerequisites

**Recommended:** Docker + Compose - everything including Wings runs in containers, nothing else needed.

**Without Docker:** Rust 1.80+, Bun (or Node.js), and a [Wings](https://github.com/pelican-dev/wings) daemon.

---

## Getting Started

```bash
git clone https://github.com/smileyfaceskobochka/pinion && cd pinion
cp .env.example .env
# set PINION_JWT_SECRET — openssl rand -hex 64

docker compose up -d
```

Open `http://localhost`, register your account, add a Wings node under Admin → Nodes, and you're off.

---

## Tech Stack

| | |
|---|---|
| Backend | Rust, Axum 0.8, Tokio, SQLx |
| Database | PostgreSQL |
| Frontend | React, Vite, TanStack Router, xterm.js |
| Runtime | Bun |
| Proxy | Caddy |
| Daemon | [Wings](https://github.com/pelican-dev/wings) |

---
<img
  style="display: block; 
    margin-left: auto;
    margin-right: auto;
    width: 90%;"
  src="https://private-user-images.githubusercontent.com/101476002/560386303-84ef1fa5-2f34-4b8e-8805-c5100fd44e4a.svg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzMwNzA0NDIsIm5iZiI6MTc3MzA3MDE0MiwicGF0aCI6Ii8xMDE0NzYwMDIvNTYwMzg2MzAzLTg0ZWYxZmE1LTJmMzQtNGI4ZS04ODA1LWM1MTAwZmQ0NGU0YS5zdmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMzA5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDMwOVQxNTI5MDJaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1kNmMwYTRjOTM0MmE0ZTc5MmFjNzY0MjJkZWU1ZGJiMTM3NTg0ZDMwZTg0MmU2ZTE2ZTQyMjgyNDIxOTRjOGRlJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.-wlEQoRZbkrkFHbQcIm8c5KJQTl1hi9kOlyv4lb9j7Y" alt="Pinion banner">
---

## License

MIT