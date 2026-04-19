import { Octokit } from "octokit";
import { VaultConfig, ObsidianTask } from "./types";
import matter from "gray-matter";

export class GitHubService {
  private octokit: Octokit;
  private config: VaultConfig;

  constructor(config: VaultConfig) {
    this.config = config;
    this.octokit = new Octokit({ auth: config.token });
  }

  // 取得目錄下的所有檔案資訊
  async getFiles(path: string) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: this.config.branch,
      });
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error(`Error fetching files from ${path}:`, error);
      return [];
    }
  }

  // 讀取單一 Markdown 檔案並解析
  async readMarkdown(path: string): Promise<ObsidianTask | null> {
    try {
      const { data }: any = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: this.config.branch,
      });

      if (data.type !== "file") return null;

      const content = decodeURIComponent(escape(atob(data.content)));
      const { data: frontmatter, content: body } = matter(content);

      return {
        id: data.name.replace(".md", ""),
        path,
        title: data.name.replace(".md", ""),
        project: frontmatter.專案 || "",
        status: frontmatter.狀態 === true,
        date: frontmatter.日期 || "",
        content: body,
        sha: data.sha,
      };
    } catch (error) {
      console.error(`Error reading ${path}:`, error);
      return null;
    }
  }

  // 更新檔案內容 (用於切換任務狀態或編輯)
  async updateFile(path: string, content: string, sha: string, message: string) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    return await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      message,
      content: encodedContent,
      sha,
      branch: this.config.branch,
    });
  }
}
