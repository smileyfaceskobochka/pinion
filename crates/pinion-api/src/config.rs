use config::{Config as ConfigLoader, ConfigError, Environment, File};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
  pub database_url: String,
  pub jwt_secret: String,
  pub listen_addr: String,
  pub cors_origins: Vec<String>,
}

impl Config {
  pub fn load() -> Result<Self, ConfigError> {
    let loader = ConfigLoader::builder()
      .add_source(File::with_name("config").required(false))
      .add_source(Environment::with_prefix("PINION"))
      .set_default("listen_addr", "0.0.0.0:8080")?
      .set_default("cors_origins", Vec::<String>::new())?
      .build()?;

    loader.try_deserialize()
  }
}
