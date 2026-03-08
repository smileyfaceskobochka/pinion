use pinion_core::error::PinionResult;
use pinion_core::models::Egg;
use sqlx::{Executor, Postgres, Row};
use uuid::Uuid;

pub struct EggRepo;

impl EggRepo {
  pub async fn find_by_id<'a, E>(executor: E, id: Uuid) -> PinionResult<Egg>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row = sqlx::query(
            "SELECT id, name, author, description, docker_image, startup, config, variables FROM eggs WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::EggNotFound(id))?;

    Ok(Egg {
      id: row.get("id"),
      name: row.get("name"),
      author: row.get("author"),
      description: row.get("description"),
      docker_image: row.get("docker_image"),
      startup: row.get("startup"),
      config: row.get("config"),
      variables: row.get("variables"),
    })
  }

  pub async fn upsert<'a, E>(executor: E, egg: &Egg) -> PinionResult<Egg>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row = sqlx::query(
            "INSERT INTO eggs (id, name, author, description, docker_image, startup, config, variables) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name,
                author = EXCLUDED.author,
                description = EXCLUDED.description,
                docker_image = EXCLUDED.docker_image,
                startup = EXCLUDED.startup,
                config = EXCLUDED.config,
                variables = EXCLUDED.variables
             RETURNING id, name, author, description, docker_image, startup, config, variables"
        )
        .bind(egg.id)
        .bind(&egg.name)
        .bind(&egg.author)
        .bind(&egg.description)
        .bind(&egg.docker_image)
        .bind(&egg.startup)
        .bind(&egg.config)
        .bind(&egg.variables)
        .fetch_one(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(Egg {
      id: row.get("id"),
      name: row.get("name"),
      author: row.get("author"),
      description: row.get("description"),
      docker_image: row.get("docker_image"),
      startup: row.get("startup"),
      config: row.get("config"),
      variables: row.get("variables"),
    })
  }

  pub async fn list<'a, E>(executor: E) -> PinionResult<Vec<Egg>>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let rows = sqlx::query(
            "SELECT id, name, author, description, docker_image, startup, config, variables FROM eggs",
        )
        .fetch_all(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(
      rows
        .into_iter()
        .map(|row| Egg {
          id: row.get("id"),
          name: row.get("name"),
          author: row.get("author"),
          description: row.get("description"),
          docker_image: row.get("docker_image"),
          startup: row.get("startup"),
          config: row.get("config"),
          variables: row.get("variables"),
        })
        .collect(),
    )
  }
}
