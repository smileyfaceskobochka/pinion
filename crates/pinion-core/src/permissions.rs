use bitflags::bitflags;
use serde::{Deserialize, Serialize};

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
    #[serde(transparent)]
    pub struct Permissions: i64 {
        const SERVER_VIEW          = 1 << 0;
        const SERVER_START         = 1 << 1;
        const SERVER_STOP          = 1 << 2;
        const SERVER_KILL          = 1 << 3;
        const SERVER_RESTART       = 1 << 4;
        const SERVER_CONSOLE       = 1 << 5;
        const SERVER_COMMAND       = 1 << 6;

        const FILE_READ            = 1 << 7;
        const FILE_READ_CONTENT    = 1 << 8;
        const FILE_CREATE          = 1 << 9;
        const FILE_UPDATE          = 1 << 10;
        const FILE_DELETE          = 1 << 11;
        const FILE_ARCHIVE         = 1 << 12;
        const FILE_SFTP            = 1 << 13;

        const BACKUP_CREATE        = 1 << 14;
        const BACKUP_READ          = 1 << 15;
        const BACKUP_DELETE        = 1 << 16;
        const BACKUP_RESTORE       = 1 << 17;

        const ADMIN_USERS          = 1 << 18;
        const ADMIN_NODES          = 1 << 19;
        const ADMIN_SERVERS        = 1 << 20;
        const ADMIN_EGGS           = 1 << 21;
        const ADMIN_ALLOCATIONS    = 1 << 22;

        const SERVER_OPERATOR      = Self::SERVER_VIEW.bits() | Self::SERVER_START.bits() | Self::SERVER_STOP.bits() | Self::SERVER_RESTART.bits() | Self::SERVER_CONSOLE.bits() | Self::SERVER_COMMAND.bits();
        const FILE_MANAGER         = Self::FILE_READ.bits() | Self::FILE_READ_CONTENT.bits() | Self::FILE_CREATE.bits() | Self::FILE_UPDATE.bits() | Self::FILE_DELETE.bits();
        const FULL_ADMIN           = i64::MAX;
    }
}

impl Default for Permissions {
  fn default() -> Self {
    Self::empty()
  }
}
