FROM oven/bun:latest as dev
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
EXPOSE 5173
CMD ["bun", "run", "dev", "--host"]

FROM oven/bun:latest as builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
RUN bun run build

FROM caddy:alpine
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
