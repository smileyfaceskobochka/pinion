-- 0001_init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    root_admin    BOOLEAN NOT NULL DEFAULT false,
    permissions   BIGINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE nodes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    fqdn         TEXT NOT NULL,
    scheme       TEXT NOT NULL DEFAULT 'https',
    port         INTEGER NOT NULL DEFAULT 8080,
    daemon_token TEXT NOT NULL,
    memory       BIGINT NOT NULL,
    disk         BIGINT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE eggs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    author       TEXT NOT NULL DEFAULT '',
    description  TEXT,
    docker_image TEXT NOT NULL,
    startup      TEXT NOT NULL,
    config       JSONB NOT NULL DEFAULT '{}',
    variables    JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE allocations (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id   UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    ip        TEXT NOT NULL,
    port      INTEGER NOT NULL,
    server_id UUID,
    notes     TEXT,
    UNIQUE(node_id, ip, port)
);

CREATE TABLE servers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    description      TEXT,
    owner_id         UUID NOT NULL REFERENCES users(id),
    node_id          UUID NOT NULL REFERENCES nodes(id),
    allocation_id    UUID NOT NULL REFERENCES allocations(id),
    egg_id           UUID NOT NULL REFERENCES eggs(id),
    status           TEXT NOT NULL DEFAULT 'installing',
    memory           BIGINT NOT NULL,
    disk             BIGINT NOT NULL,
    cpu              BIGINT NOT NULL,
    io               BIGINT NOT NULL DEFAULT 500,
    swap             BIGINT NOT NULL DEFAULT 0,
    threads          INTEGER NOT NULL DEFAULT 0,
    environment      JSONB NOT NULL DEFAULT '{}',
    startup_override TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subusers (
    server_id   UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (server_id, user_id)
);

CREATE TABLE backups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id  UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    size       BIGINT,
    completed  BOOLEAN NOT NULL DEFAULT false,
    checksum   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
