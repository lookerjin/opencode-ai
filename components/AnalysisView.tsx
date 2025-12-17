
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RepoAnalysis, FileNode } from '../types';
import { Github, ChevronRight, Folder, FileCode, ChevronDown, BookOpen, ArrowLeft, Layers, Zap, Box, Copy, Check, WrapText, ZoomIn, X, Menu, AlertCircle, RefreshCw, Moon, Sun } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { getRepoContents, getFileContent } from '../services/githubService';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AnalysisViewProps {
  analysis: RepoAnalysis;
  onBack: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// --- Helper Functions ---

// Recursively extract text from React children
const extractText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
};

// Generate a URL-friendly ID from a header string
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\u4e00-\u9fa5-]/g, '') // Remove all non-word chars (except Chinese and -)
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c', cpp: 'cpp', h: 'cpp',
    cs: 'csharp',
    html: 'html', css: 'css', scss: 'scss',
    json: 'json',
    yml: 'yaml', yaml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash', bash: 'bash',
    dockerfile: 'dockerfile',
    php: 'php'
  };
  return ext ? (map[ext] || 'text') : 'text';
};

// --- Sub-components ---

// 1. Client-Side Mermaid Renderer (Optimized)
const MermaidRenderer: React.FC<{ content: string; onZoom: (src: string) => void }> = ({ content, onZoom }) => {
  const [svg, setSvg] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      if (!content) return;
      
      // Delay slightly to ensure fonts are loaded and layout is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!isMounted) return;

      const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Comprehensive configuration to fix text size/overflow issues
        mermaid.initialize({ 
            startOnLoad: false, 
            theme: isDark ? 'dark' : 'base', // Use 'base' to allow full variable override
            securityLevel: 'loose',
            fontFamily: 'Inter, "Noto Sans SC", sans-serif', // Match app font
            themeVariables: {
              fontFamily: 'Inter, "Noto Sans SC", sans-serif',
              fontSize: '14px',
              
              // Light Mode Colors
              primaryColor: isDark ? '#1e293b' : '#ffffff',
              primaryTextColor: isDark ? '#e2e8f0' : '#334155',
              primaryBorderColor: isDark ? '#475569' : '#94a3b8',
              lineColor: isDark ? '#94a3b8' : '#64748b',
              secondaryColor: isDark ? '#0f172a' : '#f8fafc',
              tertiaryColor: isDark ? '#1e293b' : '#ffffff',
              
              // Fix "Invisible Text" in nodes
              nodeTextColor: isDark ? '#e2e8f0' : '#1e293b', 
              mainBkg: isDark ? '#1e293b' : '#ffffff',
              edgeLabelBackground: isDark ? '#334155' : '#e2e8f0',
            },
            flowchart: { 
              htmlLabels: true, // true produces sharper text but can cause overflow if CSS conflicts
              curve: 'basis',
              padding: 20 
            },
            sequence: {
              actorMargin: 50,
              boxMargin: 10,
              boxTextMargin: 5,
              noteMargin: 10,
              messageMargin: 35
            }
        });

        const { svg } = await mermaid.render(uniqueId, content);
        
        if (isMounted) {
          setSvg(svg);
          setStatus('success');
        }
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        if (isMounted) setStatus('error');
      }
    };

    setStatus('loading');
    renderChart();

    return () => { isMounted = false; };
  }, [content]); // Depend ONLY on content, not theme changes to avoid flashes

  const handleZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (status !== 'success' || !svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    onZoom(url);
  };

  if (status === 'error') {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm font-mono my-4">
        <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16}/> 
            <span>Diagram Render Failed</span>
        </div>
        <div className="opacity-80 text-xs whitespace-pre-wrap max-h-32 overflow-auto">{content}</div>
      </div>
    );
  }

  return (
    <div 
        className={`my-8 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col items-center group relative overflow-hidden transition-all ${status === 'success' ? 'cursor-zoom-in hover:border-indigo-300 dark:hover:border-slate-600' : ''}`}
        onClick={handleZoom}
    >
        {/* Header */}
        <div className="w-full px-4 py-2 text-xs text-slate-400 font-mono border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              <Layers size={12} className="text-indigo-500"/>
              架构视图
            </span>
             {/* Convert SVG to Data URL for Zooming */}
            {status === 'success' && (
              <span 
                  className="flex items-center gap-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:underline" 
                  onClick={handleZoom}
              >
                  <ZoomIn size={12}/> 全屏
              </span>
            )}
        </div>

        {/* Content Container */}
        <div 
            ref={containerRef}
            className="w-full overflow-x-auto flex justify-center bg-white dark:bg-slate-800 p-4 min-h-[150px]"
        >
          {status === 'loading' ? (
             // Elegant Skeleton Loader
             <div className="w-full max-w-lg h-48 animate-pulse flex flex-col items-center justify-center gap-4">
               <div className="flex gap-8">
                 <div className="w-24 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
                 <div className="w-24 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
               </div>
               <div className="w-0.5 h-8 bg-slate-100 dark:bg-slate-700"></div>
               <div className="w-32 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
             </div>
          ) : (
             <div 
               className="mermaid-svg-container"
               dangerouslySetInnerHTML={{ __html: svg }}
             />
          )}
        </div>
    </div>
  );
};


const FileTreeItem: React.FC<{ 
  node: FileNode; 
  repoName: string; 
  level: number;
  onSelectFile: (node: FileNode) => void; 
}> = ({ node, repoName, level, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'dir') {
      if (!isOpen && children.length === 0) {
        setIsLoading(true);
        const data = await getRepoContents(repoName, node.path);
        setChildren(data);
        setIsLoading(false);
      }
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node);
    }
  };

  return (
    <div>
      <div 
        className={`flex items-center gap-1.5 py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm rounded mx-1 ${level > 0 ? 'ml-3' : ''}`}
        onClick={handleToggle}
        style={{ paddingLeft: `${level * 8 + 8}px` }}
      >
        {node.type === 'dir' ? (
          <>
            {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            <Folder size={14} className="text-blue-400 fill-blue-100 dark:fill-blue-900" />
          </>
        ) : (
          <FileCode size={14} className="text-slate-400" />
        )}
        <span className={`truncate ${node.type === 'dir' ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
          {node.name}
        </span>
      </div>
      {isOpen && (
        <div className="border-l border-slate-100 dark:border-slate-800 ml-2">
          {isLoading ? (
            <div className="pl-6 py-1 text-xs text-slate-400">加载中...</div>
          ) : (
            children.map(child => (
              <FileTreeItem 
                key={child.sha} 
                node={child} 
                repoName={repoName} 
                level={level + 1} 
                onSelectFile={onSelectFile}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const CodeBlock: React.FC<any> = ({ className, children, onZoomImage, inline, ...props }) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  
  // Safely handle children to ensure we always have a string
  const content = children ? String(children).replace(/\n$/, '') : '';

  // Check if it looks like a Mermaid diagram
  const looksLikeMermaid = content.trim().startsWith('sequenceDiagram') || 
                           content.trim().startsWith('graph ') || 
                           content.trim().startsWith('classDiagram') || 
                           content.trim().startsWith('erDiagram') ||
                           content.trim().startsWith('stateDiagram') ||
                           content.trim().startsWith('gantt') ||
                           content.trim().startsWith('pie');

  const match = /language-(\w+)/.exec(className || '');
  const isMermaid = (match && match[1] === 'mermaid') || (className === undefined && looksLikeMermaid);

  // Heuristic: If it's a block (inline=false) but content is short, single line, and NOT mermaid
  const isShortSingleLine = !inline && !content.includes('\n') && content.length < 80;

  // 1. Handle Inline Code
  if (inline || (isShortSingleLine && !isMermaid)) {
    return (
      <code 
        className="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 rounded px-1.5 py-0.5 text-sm font-mono border border-slate-200 dark:border-slate-700 mx-1 align-middle" 
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 2. Handle Mermaid Diagram (Client Side Rendering)
  if (isMermaid) {
    return <MermaidRenderer content={content.trim()} onZoom={onZoomImage} />;
  }

  // 3. Handle Standard Code Block with Syntax Highlighting
  const lang = match ? match[1] : 'text';

  return (
    <div className="rounded-xl overflow-hidden my-6 border border-slate-200 dark:border-slate-700 shadow-sm bg-[#1e1e1e] dark:bg-slate-900 group flex flex-col">
      <div className="bg-[#252526] dark:bg-slate-800 px-4 py-2 text-xs text-slate-400 border-b border-[#333] dark:border-slate-700 font-mono flex justify-between items-center select-none shrink-0">
        <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{lang.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setWrap(!wrap)} 
            className={`p-1 rounded hover:bg-slate-600 transition-colors ${wrap ? 'text-blue-400 bg-blue-900/30' : 'text-slate-400'}`}
            title="Toggle Wrap"
          >
            <WrapText size={14} />
          </button>
          <button 
            onClick={handleCopy} 
            className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-400 hover:text-slate-300"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="relative text-sm code-scrollbar overflow-auto bg-[#1e1e1e] dark:bg-slate-900">
        <SyntaxHighlighter
          language={lang.toLowerCase()}
          style={vscDarkPlus}
          customStyle={{ 
            margin: 0, 
            padding: '1rem', 
            background: 'transparent',
            overflow: 'visible', // Parent handles scroll
            minWidth: '100%' // Ensure full width
          }}
          wrapLongLines={wrap}
          PreTag="div"
          {...props}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// --- Main Component ---

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onBack, theme, onToggleTheme }) => {
  const [rootFiles, setRootFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isTreeLoading, setIsTreeLoading] = useState(true); 
  
  const [viewWrap, setViewWrap] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [activeHeader, setActiveHeader] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tocRef = useRef<HTMLElement>(null);

  // Parse Table of Contents from Markdown
  const tableOfContents = useMemo(() => {
    if (!analysis.content) return [];
    
    const lines = analysis.content.split('\n');
    const toc: TocItem[] = [];
    const idSet = new Set<string>();
    let inCodeBlock = false;

    lines.forEach(line => {
      // Toggle code block state
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) return; // Skip headers inside code blocks

      // Match #, ##, ### (Levels 1-3)
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Remove markdown formatting symbols from the text for the TOC label
        const cleanText = text.replace(/(\*\*|__|`|\[|\])/g, '');
        let id = slugify(cleanText);
        
        // Ensure unique IDs
        let counter = 1;
        const originalId = id;
        while (idSet.has(id)) {
          id = `${originalId}-${counter}`;
          counter++;
        }
        idSet.add(id);

        // Only include levels 2 and 3 in TOC for cleaner sidebar
        if (level >= 1 && level <= 3) {
            toc.push({ id, text: cleanText, level });
        }
      }
    });
    return toc;
  }, [analysis.content]);

  // Memoize markdown components to prevent flashing during scroll (when activeHeader changes)
  const markdownComponents = useMemo(() => ({
    code: (props: any) => <CodeBlock {...props} onZoomImage={setZoomedImage} />,
    // Inject IDs into headers for scrolling
    h1: ({node, children, ...props}: any) => {
        const text = extractText(children);
        const id = slugify(text);
        return <h1 id={id} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-6 mt-10 first:mt-0 pb-4 border-b border-slate-100 dark:border-slate-800" {...props}>{children}</h1>;
    },
    h2: ({node, children, ...props}: any) => {
        const text = extractText(children);
        const id = slugify(text);
        return <h2 id={id} className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800" {...props}>{children}</h2>;
    },
    h3: ({node, children, ...props}: any) => {
        const text = extractText(children);
        const id = slugify(text);
        return <h3 id={id} className="text-lg font-bold mt-8 mb-4 text-slate-800 dark:text-slate-200" {...props}>{children}</h3>;
    },
    img: ({src, alt, ...props}: any) => (
      <img 
        src={src} 
        alt={alt} 
        className="rounded-lg border border-slate-200 dark:border-slate-700 cursor-zoom-in hover:opacity-90 transition-opacity bg-white dark:bg-slate-800"
        onClick={() => src && setZoomedImage(src)}
        {...props} 
      />
    ),
    strong: ({node, ...props}: any) => <strong className="font-bold text-slate-800 dark:text-slate-100" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 leading-relaxed text-slate-600 dark:text-slate-300" {...props} />,
    li: ({node, ...props}: any) => <li className="mb-2 text-slate-600 dark:text-slate-300" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 italic" {...props} />,
    table: ({node, ...props}: any) => <div className="overflow-x-auto my-6"><table className="min-w-full text-left text-sm" {...props} /></div>,
    th: ({node, ...props}: any) => <th className="bg-slate-50 dark:bg-slate-800 font-semibold p-3 text-slate-900 dark:text-slate-200 border-b dark:border-slate-700" {...props} />,
    td: ({node, ...props}: any) => <td className="p-3 border-b dark:border-slate-700 text-slate-600 dark:text-slate-300" {...props} />,
  }), []); // Empty dependency array = stable across renders

  useEffect(() => {
    const fetchRoot = async () => {
      setIsTreeLoading(true);
      const data = await getRepoContents(analysis.repoName);
      setRootFiles(data);
      setIsTreeLoading(false);
    };
    fetchRoot();
  }, [analysis.repoName]);

  // Enhanced Scroll Spy
  useEffect(() => {
    if (selectedFile) return; // Don't spy when viewing file

    const handleScroll = () => {
      const container = document.getElementById('content-area');
      if (!container) return;

      // Check if we are at the very bottom of the scroll container
      const isBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 50;
      
      if (isBottom && tableOfContents.length > 0) {
        // Force select the last item
        setActiveHeader(tableOfContents[tableOfContents.length - 1].id);
        return;
      }

      // Standard Spy Logic
      const headings = document.querySelectorAll('h1[id], h2[id], h3[id]');
      let current = '';
      
      headings.forEach((heading) => {
        const top = heading.getBoundingClientRect().top;
        if (top < 150) {
            current = heading.id;
        }
      });
      
      if (current) setActiveHeader(current);
    };

    const container = document.getElementById('content-area');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Trigger once on mount to set initial
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [selectedFile, tableOfContents]);

  // Auto-scroll sidebar when activeHeader changes
  useEffect(() => {
    if (activeHeader) {
        const activeBtn = document.getElementById(`toc-btn-${activeHeader}`);
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [activeHeader]);

  const handleSelectFile = async (node: FileNode) => {
    setSelectedFile(node);
    setIsFileLoading(true);
    if (node.download_url) {
      const content = await getFileContent(node.download_url);
      setFileContent(content);
    } else {
      setFileContent('无法读取文件内容 (API 限制)');
    }
    setIsFileLoading(false);
    // Scroll content area to top
    document.getElementById('content-area')?.scrollTo(0, 0);
  };

  const closeFileView = () => {
    setSelectedFile(null);
    setFileContent('');
  };

  const scrollToHeader = (id: string) => {
    closeFileView();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveHeader(id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-slate-900 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2 truncate max-w-[200px] sm:max-w-none">
            {analysis.repoName}
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-100 dark:border-indigo-800 hidden sm:inline-block">
              Analysis
            </span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Theme Toggle Removed */}

           <button 
             className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
           >
             <Menu size={20} />
           </button>
           <a 
             href={`https://github.com/${analysis.repoName}`} 
             target="_blank" 
             rel="noreferrer" 
             className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md hover:border-slate-300 dark:hover:border-slate-600 transition-all bg-slate-50 dark:bg-slate-800"
           >
            <Github size={14} />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Table of Contents Sidebar (Left) */}
        <aside 
          ref={tocRef}
          className={`
          absolute md:static inset-y-0 left-0 z-20 w-64 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur md:backdrop-blur-none border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="h-12 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/95 dark:bg-slate-900/95">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={14} />
              深度解读目录
            </h3>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(false)}><X size={16}/></button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                id={`toc-btn-${item.id}`} // Added ID for scroll target
                onClick={() => scrollToHeader(item.id)}
                className={`
                  w-full text-left py-1.5 rounded-md text-sm transition-all duration-200 border-l-2 truncate pr-2
                  ${item.level === 1 ? 'font-bold mt-4 mb-1 pl-2 border-transparent text-slate-900 dark:text-white' : ''}
                  ${item.level === 2 ? 'pl-3 border-transparent' : ''}
                  ${item.level === 3 ? 'pl-6 border-transparent text-xs' : ''}
                  ${activeHeader === item.id 
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}
                `}
                title={item.text}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area (Center) */}
        <main id="content-area" className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative scroll-smooth custom-scrollbar">
          {selectedFile ? (
            /* File Viewer Mode */
            <div className="min-h-full flex flex-col bg-[#1e1e1e] dark:bg-slate-900">
              {/* Header Color Changed to Match Sidebars */}
              <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 h-12 px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-mono">
                  <FileCode size={16} className="text-blue-500" />
                  {selectedFile.path}
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setViewWrap(!viewWrap)}
                     className={`p-1.5 rounded text-xs flex items-center gap-1 ${viewWrap ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                   >
                     <WrapText size={14} /> 换行
                   </button>
                   <button onClick={closeFileView} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 transition-colors">
                     关闭文件
                   </button>
                </div>
              </div>
              <div className="flex-1 relative">
                {isFileLoading ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm animate-pulse">
                    正在加载代码...
                  </div>
                ) : (
                   /* 
                      CRITICAL FIX: 
                      1. Use 'absolute inset-0' to force wrapper to fill available space exactly. 
                      2. 'code-scrollbar' on this container ensures scrollbars are at viewport edges.
                      3. SyntaxHighlighter minHeight='100%' ensures background covers full height.
                   */
                   <div className="absolute inset-0 text-sm code-scrollbar overflow-auto">
                      <SyntaxHighlighter
                        language={getLanguageFromFilename(selectedFile.name)}
                        style={vscDarkPlus}
                        showLineNumbers={true}
                        wrapLongLines={viewWrap}
                        customStyle={{ 
                            margin: 0, 
                            padding: '1.5rem', 
                            background: 'transparent', // Match parent bg
                            minHeight: '100%', // Ensure it fills height
                            fontSize: '13px',
                            lineHeight: '1.5',
                            overflow: 'visible' // Pass scroll control to parent
                        }}
                      >
                        {fileContent}
                      </SyntaxHighlighter>
                   </div>
                )}
              </div>
            </div>
          ) : (
            /* Analysis Markdown View */
            <div className="max-w-4xl mx-auto px-6 py-10 sm:px-10 lg:px-12">
              
              {/* Note: We render the whole markdown stream here */}
              <div className="markdown-body dark:text-slate-300">
                <ReactMarkdown 
                  children={analysis.content} 
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                />
              </div>
              
               <div className="mt-24 pt-10 border-t border-slate-100 dark:border-slate-800 text-center pb-10">
                 <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
                   <Box size={16} />
                   <span>End of Analysis</span>
                 </div>
                 <p className="text-slate-400 text-xs">Generated by OpenCode AI</p>
               </div>
            </div>
          )}
        </main>

        {/* File Explorer Sidebar (Right - Hidden on mobile, visible on LG) */}
        <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 hidden lg:flex">
          <div className="h-12 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/95 dark:bg-slate-900/95">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Folder size={14} />
              项目源码树
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {isTreeLoading ? (
               <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
                 <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                 <span className="text-xs">Scanning repository...</span>
               </div>
            ) : rootFiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2 p-4 text-center">
                 <AlertCircle size={20} className="text-slate-300"/>
                 <span className="text-xs">
                   无法加载源码树<br/>
                   (可能触发了 GitHub API 速率限制)
                 </span>
               </div>
            ) : (
              rootFiles.map(node => (
                <FileTreeItem 
                  key={node.sha} 
                  node={node} 
                  repoName={analysis.repoName} 
                  level={0}
                  onSelectFile={handleSelectFile}
                />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
