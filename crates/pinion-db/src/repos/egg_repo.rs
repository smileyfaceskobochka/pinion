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
            "SELECT id, name, description, docker_image, startup, config_files, config_startup, created_at, updated_at FROM eggs WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::EggNotFound(id))?;

    Ok(Egg {
      id: row.get("id"),
      name: row.get("name"),
      description: row.get("description"),
      docker_image: row.get("docker_image"),
      startup: row.get("startup"),
      config_files: row.get("config_files"),
      config_startup: row.get("config_startup"),
      created_at: row.get("created_at"),
      updated_at: row.get("updated_at"),
    })
  }

  pub async fn upsert<'a, E>(executor: E, egg: &Egg) -> PinionResult<Egg>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row = sqlx::query(
            "INSERT INTO eggs (id, name, description, docker_image, startup, config_files, config_startup) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                docker_image = EXCLUDED.docker_image,
                startup = EXCLUDED.startup,
                config_files = EXCLUDED.config_files,
                config_startup = EXCLUDED.config_startup,
                updated_at = now()
             RETURNING id, name, description, docker_image, startup, config_files, config_startup, created_at, updated_at"
        )
        .bind(egg.id)
        .bind(&egg.name)
        .bind(&egg.description)
        .bind(&egg.docker_image)
        .bind(&egg.startup)
        .bind(&egg.config_files)
        .bind(&egg.config_startup)
        .fetch_one(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(Egg {
      id: row.get("id"),
      name: row.get("name"),
      description: row.get("description"),
      docker_image: row.get("docker_image"),
      startup: row.get("startup"),
      config_files: row.get("config_files"),
      config_startup: row.get("config_startup"),
      created_at: row.get("created_at"),
      updated_at: row.get("updated_at"),
    })
  }

  pub async fn list<'a, E>(executor: E) -> PinionResult<Vec<Egg>>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let rows = sqlx::query(
            "SELECT id, name, description, docker_image, startup, config_files, config_startup, created_at, updated_at FROM eggs",
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
          description: row.get("description"),
          docker_image: row.get("docker_image"),
          startup: row.get("startup"),
          config_files: row.get("config_files"),
          config_startup: row.get("config_startup"),
          created_at: row.get("created_at"),
          updated_at: row.get("updated_at"),
        })
        .collect(),
    )
  }
}
