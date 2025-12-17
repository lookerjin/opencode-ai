import React, { useState, useEffect } from 'react';
import { Search, Github, Sparkles, Terminal, Book, Code2, TrendingUp, ChevronDown, Settings, Moon, Sun, X } from 'lucide-react';
import { RepoCard } from './components/RepoCard';
import { AnalysisView } from './components/AnalysisView';
import { LoadingState } from './components/LoadingState';
import { SettingsModal } from './components/SettingsModal';
import { searchRepositories, getTrendingRepos } from './services/githubService';
import { generateRepoAnalysis as generateAnalysis } from './services/aiService';
import { GitHubRepo, RepoAnalysis, LoadingStatus } from './types';

// Placeholder component for landing features
const FeatureItem: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

type Period = 'daily' | 'weekly' | 'monthly';

const SPOKEN_LANGUAGES = [
  { label: '全部', value: 'All' },
  { label: '中文', value: 'zh' },
  { label: '英语', value: 'en' },
  { label: '日语', value: 'ja' },
  { label: '法语', value: 'fr' },
];

const PROGRAMMING_LANGUAGES = [
  { label: '全部', value: 'All' },
  { label: 'JavaScript', value: 'JavaScript' },
  { label: 'TypeScript', value: 'TypeScript' },
  { label: 'Python', value: 'Python' },
  { label: 'Go', value: 'Go' },
  { label: 'Java', value: 'Java' },
  { label: 'Rust', value: 'Rust' },
  { label: 'C++', value: 'C++' },
  { label: 'Swift', value: 'Swift' },
  { label: 'Vue', value: 'Vue' },
  { label: 'React', value: 'React' },
];

const DATE_RANGES = [
  { label: '今天', value: 'daily' },
  { label: '本周', value: 'weekly' },
  { label: '本月', value: 'monthly' },
];

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [trendingRepos, setTrendingRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [status, setStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);
  const [searchError, setSearchError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Trending Filters
  const [period, setPeriod] = useState<Period>('daily');
  const [language, setLanguage] = useState('All');
  const [spokenLanguage, setSpokenLanguage] = useState('All');

  // Fetch trending repos on mount or filter change
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingRepos([]); 
      const data = await getTrendingRepos(period, language);
      setTrendingRepos(data);
    };
    fetchTrending();
  }, [period, language, spokenLanguage]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setStatus(LoadingStatus.SEARCHING);
    setSearchError('');
    setRepos([]);
    
    try {
      const results = await searchRepositories(query);
      setRepos(results);
      if (results.length === 0) {
        setSearchError('未找到相关项目，请更换关键词尝试。');
      }
      setStatus(LoadingStatus.IDLE);
    } catch (err) {
      setSearchError('搜索失败，请稍后重试');
      setStatus(LoadingStatus.IDLE);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setRepos([]);
    setSearchError('');
    setStatus(LoadingStatus.IDLE);
  }

  const handleRepoSelect = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setAnalysis(null);
    setStatus(LoadingStatus.ANALYZING);
    
    // Simulate scroll to top
    window.scrollTo(0, 0);

    try {
      const result = await generateAnalysis(repo.full_name, repo.description || '');
      setAnalysis(result);
      setStatus(LoadingStatus.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setStatus(LoadingStatus.ERROR);
      setSearchError(err.message || "生成失败");
    }
  };

  const handleBack = () => {
    setSelectedRepo(null);
    setAnalysis(null);
    setStatus(LoadingStatus.IDLE);
  };

  // Render Analysis View
  if (selectedRepo && status === LoadingStatus.COMPLETE && analysis) {
    return (
      <AnalysisView 
        analysis={analysis} 
        onBack={handleBack} 
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />
    );
  }

  // Render Loading or Error during Analysis
  if (selectedRepo && (status === LoadingStatus.ANALYZING || status === LoadingStatus.ERROR)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center pt-20 px-4">
        {status === LoadingStatus.ANALYZING ? (
           <LoadingState />
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">!</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">生成失败</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{searchError || "AI 模型响应超时或配额不足，请稍后重试。"}</p>
            <button onClick={handleBack} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium">
              返回
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render Home / Search View
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { handleClearSearch(); handleBack(); }}>
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">OpenCode AI</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
               {/* Theme Toggle */}
               <button
                 onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                 className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                 title={theme === 'light' ? "切换至深色模式" : "切换至浅色模式"}
               >
                 {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
               </button>

               <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
               >
                 <Settings size={18} />
                 <span className="hidden sm:inline">API 设置</span>
               </button>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium">
                <Github size={18} />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6 border border-blue-100 dark:border-blue-800">
            <TrendingUp size={12} />
            <span>全新升级多模型深度解读引擎</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
            秒级看懂 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">任意开源项目</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            为您生成包含<b>架构图</b>、<b>时序图</b>和<b>源码切片</b>的深度技术报告。
            <br/>支持 DeepSeek, GPT-4o, Claude 等多种模型。
          </p>

          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto group z-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${status === LoadingStatus.SEARCHING ? 'text-indigo-500' : 'text-slate-400'}`} />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-28 sm:pr-32 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-lg shadow-indigo-100 dark:shadow-none hover:border-slate-300 dark:hover:border-slate-600 text-lg"
              placeholder="输入 GitHub 仓库名 (例如: redis/redis)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={status === LoadingStatus.SEARCHING}
            />
            {query && status !== LoadingStatus.SEARCHING && (
              <button 
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-24 sm:right-28 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
            <button 
              type="submit" 
              disabled={!query.trim() || status === LoadingStatus.SEARCHING}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 rounded-xl transition-colors"
            >
              {status === LoadingStatus.SEARCHING ? '...' : '解读'}
            </button>
          </form>
          {searchError && <p className="mt-3 text-red-500 text-sm font-medium">{searchError}</p>}
        </div>

        {/* Search Results (Priority over Trending) */}
        {repos.length > 0 ? (
          <div className="mb-20 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Search size={20} className="text-indigo-500" />
                搜索结果: "{query}"
              </h2>
              <button 
                onClick={handleClearSearch}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <X size={16} />
                清除搜索 / 返回热门
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} onClick={handleRepoSelect} />
              ))}
            </div>
          </div>
        ) : (
          /* Trending / Popular Section */
          <div className="mb-20">
            {/* Trending Header & Filters - Reorganized Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 shrink-0 px-2 sm:px-0">
                <TrendingUp size={20} className="text-rose-500" />
                热门项目 (Trending)
              </h2>
              
              <div className="flex flex-row flex-wrap items-center gap-4 px-2 sm:px-0">
                {/* Spoken Language */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">交流语言:</span>
                    <div className="relative group">
                        <select 
                            value={spokenLanguage}
                            onChange={(e) => setSpokenLanguage(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium px-3 py-1.5 pr-8 rounded-lg cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm hover:border-indigo-300 dark:hover:border-slate-600 transition-colors"
                        >
                        {SPOKEN_LANGUAGES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Programming Language */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">开发语言:</span>
                    <div className="relative group">
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium px-3 py-1.5 pr-8 rounded-lg cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm hover:border-indigo-300 dark:hover:border-slate-600 transition-colors"
                        >
                        {PROGRAMMING_LANGUAGES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Period */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">时间范围:</span>
                    <div className="relative group">
                        <select 
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as Period)}
                            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium px-3 py-1.5 pr-8 rounded-lg cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm hover:border-indigo-300 dark:hover:border-slate-600 transition-colors"
                        >
                        {DATE_RANGES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
              </div>
            </div>

            {/* Trending Content */}
            {trendingRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} onClick={handleRepoSelect} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                 <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                 <span className="text-sm">Fetching trending repos...</span>
              </div>
            )}
          </div>
        )}

        {/* Feature Highlights (Only show if no search results) */}
        {repos.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto opacity-90 mt-10 border-t border-slate-100 dark:border-slate-800 pt-16">
            <FeatureItem 
              icon={<Book className="w-6 h-6" />}
              title="原理级可视化"
              desc="AI 自动生成 Mermaid 架构图与时序图，直观展示复杂系统的内部流转机制。"
            />
            <FeatureItem 
              icon={<Code2 className="w-6 h-6" />}
              title="源码切片分析"
              desc="像资深架构师一样，为您圈出核心代码片段，逐行解析其设计思想与实现细节。"
            />
            <FeatureItem 
              icon={<Terminal className="w-6 h-6" />}
              title="工程最佳实践"
              desc="挖掘项目中的设计模式、测试策略与性能优化技巧，助您写出更好的代码。"
            />
          </div>
        )}
      </main>
      
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} OpenCode AI.
        </div>
      </footer>
    </div>
  );
};

export default App;