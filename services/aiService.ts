
import { GoogleGenAI } from "@google/genai";
import { RepoAnalysis, AIConfig, DEFAULT_AI_CONFIG } from '../types';

const getConfig = (): AIConfig => {
  const saved = localStorage.getItem('ai_config');
  return saved ? JSON.parse(saved) : DEFAULT_AI_CONFIG;
};

// Robust Markdown Cleanup & Repair
const repairMarkdownContent = (content: string): string => {
  if (!content) return "";
  
  let repaired = content;

  // 1. Remove outer ```markdown wrapper
  if (repaired.trim().startsWith('```markdown')) {
    repaired = repaired.replace(/^```markdown\s*/, '').replace(/\s*```$/, '');
  }
  
  // 2. Remove outer generic ``` wrapper
  if (repaired.trim().startsWith('```') && !repaired.includes('\n#')) {
      const match = repaired.match(/^```(\w*)\s+([\s\S]*?)\s*```$/);
      if (match && match[2].includes('# ')) {
          repaired = match[2];
      }
  }

  // 3. FORCE Mermaid Language Tag (Crucial Fix)
  // Look for code blocks that start with mermaid keywords but lack the 'mermaid' tag or have 'text' tag
  // Pattern matches: ``` followed by optional lang, newline, then specific mermaid keywords
  repaired = repaired.replace(
    /```(?:\w*)\n\s*(sequenceDiagram|graph |classDiagram|stateDiagram|erDiagram|pie|gantt)/g,
    '```mermaid\n$1'
  );

  // 4. Remove standalone "mermaid" word lines
  repaired = repaired.replace(/(\n|^)mermaid\s*\n/g, '$1');
  
  return repaired;
};

export const generateRepoAnalysis = async (repoFullName: string, description: string): Promise<RepoAnalysis> => {
  const config = getConfig();
  
  const userPrompt = `
    目标项目: "${repoFullName}"
    项目描述: "${description || '无描述'}"

    请填充以下标准模板。内容必须**硬核、深入**，拒绝泛泛而谈。

    # ${repoFullName} 深度技术解析

    ## 1. 核心架构与技术栈
    ### 宏观架构视图
    \`\`\`mermaid
    graph TD
    %% 节点ID必须为纯英文，显示文本为中文
    Core[核心引擎] --> Plugin[插件系统]
    Core --> Network[网络模块]
    Network --> Protocol[协议解析]
    \`\`\`
    > **架构风格**: [如：微内核架构 / 事件驱动架构 /分层架构]

    ### 技术选型辨析
    - **语言选择**: [分析为何使用该语言？例如 Go 的协程优势或 Rust 的内存安全]
    - **关键依赖**: [分析使用了哪些核心库（如 etcd, netty, tokio）及其在系统中的作用]

    ## 2. 核心难点与设计取舍 (Core Trade-offs)
    (挖掘项目中 2 个最硬核的技术难点，分析作者的解决方案)

    ### [难点1: 如 海量数据下的零拷贝传输]
    - **问题背景**: [描述面临的性能瓶颈或并发挑战]
    - **解决策略**: [深度解析解决方案，如使用了 sendfile 或 memory pool]
    - **设计妥协**: [为了解决此问题牺牲了什么？如代码复杂度增加]

    ### [难点2: 如 分布式环境下的状态一致性]
    - **问题背景**: ...
    - **解决策略**: ...

    ## 3. 关键业务流程
    ### [核心场景名称]时序图
    > 场景: [如 数据写入与持久化流程]
    \`\`\`mermaid
    sequenceDiagram
    participant Client as 客户端
    participant NodeA as 主节点
    participant Disk as 磁盘WAL
    Client->>NodeA: 发送写请求
    NodeA->>Disk: 写入日志 (fsync)
    Disk-->>NodeA: 确认落盘
    NodeA-->>Client: 返回成功
    \`\`\`

    ## 4. 核心源码解读
    (挑选 3 个最底层的核心模块。分析维度：内存管理、锁机制、状态机)

    ### [核心模块1]
    - **文件路径**: \`path/to/file.ext\`
    - **深度剖析**: [不要只翻译代码。分析这里的算法复杂度、数据结构设计或并发模型]

    \`\`\`[语言]
    // 必须包含中文行内注释，解释 Why 而不是 What
    func coreLogic() {
        // 使用双重检查锁定 (Double-checked locking) 优化性能
        if check() { ... }
    }
    \`\`\`

    ### [核心模块2]
    - **文件路径**: \`path/to/file.ext\`
    - **深度剖析**: ...

    \`\`\`[语言]
    // 关键代码
    \`\`\`

    ### [核心模块3]
    - **文件路径**: \`path/to/file.ext\`
    - **深度剖析**: ...

    \`\`\`[语言]
    // 关键代码
    \`\`\`

    ## 5. 目录结构
    \`\`\`text
    root/
    ├── src/          # 核心源码
    └── docs/         # 文档
    \`\`\`

    ## 6. 总结与推荐
    - **核心价值**: [项目解决的本质问题]
    - **适用场景**: [什么情况必用]
    - **局限性**: [什么情况慎用]
    - **技术评分**: ⭐️⭐️⭐️⭐️⭐️
  `;

  let rawText = "";

  // 1. Google GenAI SDK
  if (!config.baseUrl && config.model.includes('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: userPrompt,
        config: {
          systemInstruction: config.systemPrompt,
        }
      });
      rawText = response.text || "";
    } catch (error) {
      console.error("Gemini SDK Error:", error);
      throw error;
    }
  } 
  // 2. Custom OpenAI-compatible API
  else {
    const baseUrl = config.baseUrl || "https://api.openai.com/v1";
    const apiKey = config.apiKey;
    if (!apiKey) throw new Error("请在设置中配置自定义模型的 API Key");

    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2, 
          stream: false
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API 请求失败: ${response.status} - ${err}`);
      }
      const data = await response.json();
      rawText = data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error("Custom AI API Error:", error);
      throw error;
    }
  }

  if (!rawText) throw new Error("AI output is empty");

  const repairedContent = repairMarkdownContent(rawText);

  const summaryMatch = repairedContent.match(/#.*?\n+([^#]+)/);
  const summary = summaryMatch ? summaryMatch[1].trim().slice(0, 150) + "..." : "深度技术解析";

  return {
    repoName: repoFullName,
    summary: summary,
    content: repairedContent
  };
};
