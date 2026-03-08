use pinion_core::error::PinionResult;
use pinion_core::models::User;
use sqlx::{Executor, Postgres, Row};
use uuid::Uuid;

pub struct UserRepo;

impl UserRepo {
  pub async fn find_by_id<'a, E>(executor: E, id: Uuid) -> PinionResult<User>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let user = sqlx::query(
            "SELECT id, email, password_hash, username, root_admin, permissions, created_at, updated_at FROM users WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::UserNotFound(id))?;

    Ok(User {
      id: user.get("id"),
      email: user.get("email"),
      password_hash: user.get("password_hash"),
      username: user.get("username"),
      root_admin: user.get("root_admin"),
      permissions: pinion_core::Permissions::from_bits_truncate(user.get("permissions")),
      created_at: user.get("created_at"),
      updated_at: user.get("updated_at"),
    })
  }

  pub async fn find_by_email<'a, E>(executor: E, email: &str) -> PinionResult<User>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let user = sqlx::query(
            "SELECT id, email, password_hash, username, root_admin, permissions, created_at, updated_at FROM users WHERE email = $1"
        )
        .bind(email)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::InvalidCredentials)?;

    Ok(User {
      id: user.get("id"),
      email: user.get("email"),
      password_hash: user.get("password_hash"),
      username: user.get("username"),
      root_admin: user.get("root_admin"),
      permissions: pinion_core::Permissions::from_bits_truncate(user.get("permissions")),
      created_at: user.get("created_at"),
      updated_at: user.get("updated_at"),
    })
  }

  pub async fn create<'a, E>(
    executor: E,
    email: &str,
    username: &str,
    password_hash: &str,
  ) -> PinionResult<User>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let user = sqlx::query(
            "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, password_hash, username, root_admin, permissions, created_at, updated_at"
        )
        .bind(email)
        .bind(username)
        .bind(password_hash)
        .fetch_one(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(User {
      id: user.get("id"),
      email: user.get("email"),
      password_hash: user.get("password_hash"),
      username: user.get("username"),
      root_admin: user.get("root_admin"),
      permissions: pinion_core::Permissions::from_bits_truncate(user.get("permissions")),
      created_at: user.get("created_at"),
      updated_at: user.get("updated_at"),
    })
  }

  pub async fn set_root_admin<'a, E>(executor: E, id: Uuid, value: bool) -> PinionResult<()>
  where
    E: Executor<'a, Database = Postgres>,
  {
    sqlx::query("UPDATE users SET root_admin = $1, updated_at = now() WHERE id = $2")
      .bind(value)
      .bind(id)
      .execute(executor)
      .await
      .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(())
  }

  pub async fn list<'a, E>(executor: E, limit: i64, offset: i64) -> PinionResult<Vec<User>>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let rows = sqlx::query(
            "SELECT id, email, password_hash, username, root_admin, permissions, created_at, updated_at FROM users LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(
      rows
        .into_iter()
        .map(|user| User {
          id: user.get("id"),
          email: user.get("email"),
          password_hash: user.get("password_hash"),
          username: user.get("username"),
          root_admin: user.get("root_admin"),
          permissions: pinion_core::Permissions::from_bits_truncate(user.get("permissions")),
          created_at: user.get("created_at"),
          updated_at: user.get("updated_at"),
        })
        .collect(),
    )
  }
}
