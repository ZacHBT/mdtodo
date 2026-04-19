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
    } catch (error: any) {
      console.error(`Error fetching files from ${path}:`, error);
      throw error; // Throw error to allow UI to diagnose
    }
  }

  // 讀取單一 Markdown 檔案並解析 (支援 Obsidian 混合格式)
  async readMarkdown(path: string): Promise<ObsidianTask | null> {
    try {
      const { data }: any = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: this.config.branch,
      });

      if (data.type !== "file") return null;

      // 使用更健壯的解碼方式
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      
      // 解析 YAML Frontmatter
      const { data: frontmatter, content: body } = matter(content);

      // --- 強化解析器：動態識別屬性類型 ---
      // 優先檢查是否有 Project 特有的欄位
      const hasProjectFields = '專案狀態' in frontmatter || '建立日期' in frontmatter;
      const isProject = hasProjectFields || path.includes("1_Projects") || path.includes("1_Project");
      
      let date = "";
      let status = false;
      let project = "";

      if (isProject) {
        // Project 模式
        date = frontmatter.建立日期 || frontmatter.date || "";
        status = frontmatter.專案狀態 === "已完成" || frontmatter.status === "completed";
        project = frontmatter.類型 || "";
      } else {
        // Task 模式
        date = frontmatter.日期 || frontmatter.date || "";
        status = frontmatter.狀態 === true || frontmatter.status === "completed" || frontmatter.status === true;
        project = frontmatter.專案 || "";
      }

      // 如果 YAML 沒解析到，嘗試 Regex 掃描全文 (支援行內 Metadata)
      if (!date) {
        const dateRegex = isProject ? /建立日期\s*[:：]\s*([\d-]+)/ : /日期\s*[:：]\s*([\d-]+)/;
        const dateMatch = content.match(dateRegex);
        if (dateMatch) date = dateMatch[1];
        else {
          const filenameMatch = data.name.match(/\d{4}-\d{2}-\d{2}/);
          if (filenameMatch) date = filenameMatch[0];
        }
      }

      // --- 強制規格化日期格式 ---
      if (date) {
        // 如果是 Date 物件轉出來的字串，提取 前 10 碼 YYYY-MM-DD
        const isoMatch = String(date).match(/(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) {
          date = isoMatch[1];
        }
      }

      // 針對狀態的備援檢查
      const contentLower = content.toLowerCase();
      if (isProject) {
        if (content.includes("專案狀態: \"已完成\"") || content.includes("專案狀態: 已完成")) status = true;
      } else {
        if (content.includes("狀態: true") || content.includes("狀態 true")) status = true;
        if (contentLower.includes("status: completed") || contentLower.includes("status: true")) status = true;
      }

      if (!project && !isProject) {
        const projectMatch = content.match(/專案\s*[:：]\s*\[\[(.*?)\]\]/);
        if (projectMatch) project = projectMatch[1];
      }

      // 清洗專案名稱中的 Wikilinks
      if (project && typeof project === 'string') {
        project = project.replace(/\[\[|\]\]/g, "").split("/").pop() || project;
      }

      return {
        id: data.name.replace(".md", ""),
        path,
        title: (frontmatter.title || data.name).replace(".md", ""),
        project: String(project || ""),
        status,
        date: String(date || ""),
        content: body || content,
        sha: data.sha,
        metadata: {
          isProject,
          type: frontmatter.類型,
          projectStatus: frontmatter.專案狀態,
          originalMeta: frontmatter
        }
      } as any;
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

  // 自動偵測 PARA 目錄名稱 (例如 1_Project 或 1_Projects)
  async findPathWithPrefix(prefix: string): Promise<string> {
    try {
      const rootFiles = await this.getFiles("");
      const match = rootFiles.find(f => f.type === "dir" && f.name.startsWith(prefix));
      return match ? match.name : "";
    } catch (error) {
      console.error(`Error discovering path with prefix ${prefix}:`, error);
      return "";
    }
  }
}
