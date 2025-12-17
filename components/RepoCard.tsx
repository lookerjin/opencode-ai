import React from 'react';
import { GitHubRepo } from '../types';
import { Star, GitFork, Code } from 'lucide-react';

interface RepoCardProps {
  repo: GitHubRepo;
  onClick: (repo: GitHubRepo) => void;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, onClick }) => {
  return (
    <div 
      onClick={() => onClick(repo)}
      className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-3">
        <img 
          src={repo.owner.avatar_url} 
          alt={repo.owner.login} 
          className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-600"
        />
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
          {repo.full_name}
        </h3>
      </div>
      
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 h-10">
        {repo.description || "暂无描述"}
      </p>
      
      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-1">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          <span>{repo.stargazers_count.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitFork size={14} />
          <span>{repo.forks_count ? repo.forks_count.toLocaleString() : 0}</span> 
        </div>
        {repo.language && (
          <div className="flex items-center gap-1">
            <Code size={14} className="text-blue-400" />
            <span>{repo.language}</span>
          </div>
        )}
      </div>
    </div>
  );
};