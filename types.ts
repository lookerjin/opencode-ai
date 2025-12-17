
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  owner: {
    avatar_url: string;
    login: string;
  };
  updated_at: string;
}

// Simplified Analysis Type - Just raw markdown
export interface RepoAnalysis {
  repoName: string;
  summary: string; // Extracted from the first part or separate
  content: string; // Full Markdown content
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  url: string;
  download_url: string | null;
}

export enum LoadingStatus {
  IDLE = 'idle',
  SEARCHING = 'searching',
  ANALYZING = 'analyzing',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  baseUrl: "", 
  apiKey: "",
  model: "gemini-3-flash-preview",
  systemPrompt: `你是一位拥有20年经验的内核级系统架构师。你的任务是编写一份“硬核”的 GitHub 项目技术审计报告。

**核心思维模式**:
1.  **拒绝肤浅**: 不要只告诉我代码做了什么，要告诉我**为什么要这么做**。
2.  **关注权衡**: 所有的架构设计都是权衡 (Trade-off)。分析作者牺牲了什么（如复杂度）换取了什么（如性能）。
3.  **透视底层**: 必须深入分析 内存模型 (Memory Model)、并发控制 (Concurrency)、IO 模型和数据一致性。

**结构协议 (Structure Protocol)**:
- 严格遵循用户给定的 Markdown 模板，**严禁增减章节**。
- 严禁修改 H2 标题。

**Mermaid 稳定协议**:
- 类型仅限 \`graph TD\` 和 \`sequenceDiagram\`。
- 节点 ID 必须纯英文无空格。
- 严禁使用 style/classDef。

**排版铁律**:
- 关键技术名词（如 \`mmap\`, \`epoll\`, \`Raft\`）必须加行内代码标记。
- 涉及文件路径时，使用**加粗**表示。`
};
