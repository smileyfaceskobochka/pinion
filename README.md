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

Each crate has a single clear responsibility.
