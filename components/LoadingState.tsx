import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC = () => {
  const steps = [
    "正在连接 GitHub API...",
    "正在读取项目文档...",
    "分析架构设计...",
    "生成核心代码解读...",
    "正在整理知识图谱..."
  ];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-xl relative z-10">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
      
      <h3 className="mt-8 text-xl font-semibold text-slate-800 dark:text-white">
        AI 正在深度解读中
      </h3>
      
      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse min-h-[20px]">
          {steps[currentStep]}
        </p>
        <div className="flex gap-1 mt-2">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                idx <= currentStep ? 'bg-blue-500 dark:bg-blue-400' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};