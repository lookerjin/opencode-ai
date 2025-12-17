import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Settings2 } from 'lucide-react';
import { AIConfig, DEFAULT_AI_CONFIG } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_MODELS = [
  { name: 'Gemini 3.0 Flash (Default)', value: 'gemini-3-flash-preview' },
  { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash-exp' },
  { name: 'DeepSeek-V3', value: 'deepseek-chat' },
  { name: 'DeepSeek-R1 (Thinking)', value: 'deepseek-reasoner' },
  { name: 'OpenAI GPT-4o', value: 'gpt-4o' },
  { name: 'OpenAI GPT-4o-mini', value: 'gpt-4o-mini' },
  { name: 'Claude 3.5 Sonnet (Via OneAPI)', value: 'claude-3-5-sonnet-20240620' },
  { name: 'Qwen 2.5 (通义千问)', value: 'qwen-max' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [isCustomModel, setIsCustomModel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('ai_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        const isCommon = COMMON_MODELS.some(m => m.value === parsed.model);
        setIsCustomModel(!isCommon);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    onClose();
    // Removed reload to prevent crash
  };

  const handleResetPrompt = () => {
    setConfig(prev => ({ ...prev, systemPrompt: DEFAULT_AI_CONFIG.systemPrompt }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up border dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings2 className="text-indigo-600 dark:text-indigo-400" />
            AI 模型配置
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* API Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">API 地址 (Base URL)</label>
              <input 
                type="text" 
                value={config.baseUrl}
                onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="默认为空 (使用内置 Gemini)"
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400">若使用自定义模型 (如 DeepSeek)，请输入兼容 OpenAI 的 API 地址。</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">API Key (令牌)</label>
              <input 
                type="password" 
                value={config.apiKey}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="默认为空 (使用内置 Key)"
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400">若使用默认 Gemini 模型，留空即可。</p>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">选择模型</label>
            <div className="flex gap-2">
              {!isCustomModel ? (
                <select 
                  value={config.model}
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setIsCustomModel(true);
                      setConfig({ ...config, model: '' });
                    } else {
                      setConfig({ ...config, model: e.target.value });
                    }
                  }}
                  className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {COMMON_MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.name}</option>
                  ))}
                  <option value="custom">自定义模型...</option>
                </select>
              ) : (
                <div className="flex-1 flex gap-2">
                   <input 
                      type="text" 
                      value={config.model}
                      onChange={e => setConfig({ ...config, model: e.target.value })}
                      placeholder="输入模型 ID (例如: deepseek-chat)"
                      className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                   />
                   <button 
                     onClick={() => setIsCustomModel(false)}
                     className="px-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                   >
                     选择常用
                   </button>
                </div>
              )}
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300">系统提示词 (System Prompt)</label>
               <button 
                 onClick={handleResetPrompt}
                 className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
               >
                 <RotateCcw size={12} /> 恢复默认模板
               </button>
            </div>
            <textarea 
              value={config.systemPrompt}
              onChange={e => setConfig({ ...config, systemPrompt: e.target.value })}
              rows={10}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed custom-scrollbar"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save size={16} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};