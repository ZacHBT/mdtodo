export interface ObsidianTask {
  id: string; // 檔案名稱 (不含 .md)
  path: string; // 檔案完整路徑
  title: string;
  project?: string; // 維持 [[ProjectName]] 格式
  status: boolean;
  date: string; // YYYY-MM-DD
  content: string; // 任務主體內容
  sha?: string; // GitHub 要求的檔案 SHA
}

export interface ObsidianProject {
  id: string;
  title: string;
  path: string;
  status?: string;
  tasks: ObsidianTask[];
}

export interface VaultConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}
