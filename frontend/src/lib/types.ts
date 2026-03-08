export interface Server {
  id: string;
  uuid: string;
  name: string;
  description: string;
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
  public: boolean;
}

export interface Egg {
  id: string;
  name: string;
  description: string;
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
