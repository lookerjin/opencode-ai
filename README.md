
# OpenCode AI - GitHub 智能代码解读助手

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)
![Powered By](https://img.shields.io/badge/Powered%20by-Gemini%20%7C%20DeepSeek-orange)

**OpenCode AI** 是一款基于大语言模型的 GitHub 开源项目深度解读工具。它能够秒级分析任意 GitHub 仓库，生成包含架构图、时序图、核心难点分析和源码切片的“硬核”技术审计报告。

无需阅读晦涩的源码，通过 AI 的视角，快速掌握项目的核心设计与权衡。

## ✨ 核心功能

- **🚀 深度技术审计**: 拒绝肤浅的 Readme 翻译，专注于架构设计、技术选型辨析、核心难点与设计取舍 (Trade-offs)。
- **📊 架构可视化**: 自动生成 Mermaid 格式的 **架构视图 (Graph)** 和 **核心流程时序图 (Sequence Diagram)**，并支持全屏缩放查看。
- **🌲 沉浸式源码漫游**: 
    - 左侧提供完整的项目文件树 (File Tree)。
    - 右侧提供语法高亮的源码阅读器。
    - 智能识别文件类型并匹配高亮语言。
- **🔍 智能搜索与热门**: 支持搜索任意 GitHub 公开仓库，或查看每日/每周/每月的 GitHub Trending 热门项目。
- **⚙️ 多模型支持**: 
    - **默认**: Google Gemini 3.0/2.0 Flash (速度快，免费额度高)。
    - **自定义**: 支持在设置中配置 **DeepSeek-V3/R1**、**GPT-4o**、**Claude 3.5** 等兼容 OpenAI 格式的 API。
- **🌗 深色模式**: 完美适配日间与夜间阅读体验。

## 🛠️ 技术栈

- **前端框架**: React 19
- **构建工具**: Vite (推荐) / Parcel
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **AI SDK**: `@google/genai` (Gemini 官方 SDK)
- **渲染引擎**: 
    - `react-markdown` & `remark-gfm` (Markdown 渲染)
    - `mermaid` (图表绘制)
    - `react-syntax-highlighter` (代码高亮)
- **图标**: Lucide React

## 🚀 本地开发指南

### 1. 克隆项目

```bash
git clone https://github.com/lookerjin/opencode-ai.git
cd opencode-ai
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建一个 `.env` 文件，并添加您的 Google Gemini API Key（用于默认模型）：

```env
# 必须配置，否则默认模型无法工作
API_KEY=AIzaSy...您的GoogleApiKey...
```

> **注意**: 如果您打算发布到 Vercel/Netlify 等平台，请在平台的 Environment Variables 设置中添加 `API_KEY`。

### 4. 启动开发服务器

```bash
npm start
# 或者
npm run dev
```

打开浏览器访问 `http://localhost:1234` (或控制台提示的端口)。

## ⚙️ 模型配置说明

OpenCode AI 提供了灵活的模型配置功能（点击右上角设置图标）：

1.  **内置模式 (默认)**:
    - 使用环境变量中的 `API_KEY`。
    - 模型默认为 `gemini-3-flash-preview`。
    
2.  **自定义模式 (Bring Your Own Key)**:
    - **API 地址**: 输入兼容 OpenAI 接口的 Base URL (例如 DeepSeek 的 `https://api.deepseek.com/v1`)。
    - **API Key**: 输入对应服务商的 Key。
    - **模型**: 选择或输入模型名称 (如 `deepseek-chat`)。

## 📝 提示词工程 (System Prompt)

本项目内置了精心调优的系统提示词 (`services/aiService.ts`)，强调：
- **拒绝泛泛而谈**: 必须分析“为什么这么做”。
- **关注权衡**: 分析架构设计的牺牲与收益。
- **底层视角**: 关注内存模型、并发控制、IO 模型等。

您可以在“设置”中修改 System Prompt 以调整分析风格。

## 📄 License

MIT License.
