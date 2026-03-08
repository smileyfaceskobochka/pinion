FROM rust:bookworm as builder
WORKDIR /usr/src/pinion
COPY . .
RUN cargo build --release -p pinion-api

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /usr/src/pinion/target/release/pinion .
EXPOSE 3000
CMD ["./pinion"]
