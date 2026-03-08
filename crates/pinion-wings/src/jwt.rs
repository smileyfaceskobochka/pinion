use crate::error::WingsError;
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use time;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct WingsClaims {
  #[serde(rename = "server_uuid")]
  pub server_uuid: String,
  pub permissions: Vec<String>,
  pub jti: String,
  pub iat: i64,
  pub nbf: i64,
  pub exp: i64,
}

pub fn issue_ws_token(
  server_uuid: Uuid,
  daemon_token: &str,
  ttl_seconds: u64,
) -> Result<String, WingsError> {
  let now = time::OffsetDateTime::now_utc().unix_timestamp();
  let claims = WingsClaims {
    server_uuid: server_uuid.to_string(),
    permissions: vec!["*".to_string()],
    jti: Uuid::new_v4().to_string(),
    iat: now,
    nbf: now,
    exp: now + ttl_seconds as i64,
  };

  let key = EncodingKey::from_secret(daemon_token.as_bytes());
  encode(&Header::default(), &claims, &key).map_err(|e| WingsError::Jwt(e.to_string()))
}
