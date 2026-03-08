export interface Server {
  id: string;
  name: string;
  description: string | null;
  node_id: string;
  allocation_id: string;
  egg_id: string;
  owner_id: string;
  status: string;
  suspended: boolean;
  created_at: string;
}

export interface Node {
  id: string;
  name: string;
  fqdn: string;
  port: number;
  public: boolean;
  memory: number;
  disk: number;
}

export interface Egg {
  id: string;
  name: string;
  author: string;
  description: string;
  docker_image: string;
  startup: string;
}

export interface FileItem {
  name: string;
  size: number;
  mode: string;
  modified: string;
  is_directory: boolean;
  is_file: boolean;
  is_symlink: boolean;
  is_editable: boolean;
}
