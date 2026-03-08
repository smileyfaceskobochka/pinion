use sqlx::postgres::PgPoolOptions;
pub use sqlx::PgPool;

pub mod repos;

pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
  let pool = PgPoolOptions::new().max_connections(5).connect(database_url).await?;

  sqlx::migrate!().run(&pool).await.map_err(|e| sqlx::Error::Configuration(e.into()))?;

  Ok(pool)
}
