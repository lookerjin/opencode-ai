import { GitHubRepo, FileNode } from '../types';

export const searchRepositories = async (query: string): Promise<GitHubRepo[]> => {
  if (!query) return [];
  
  try {
    const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=9`);
    if (!response.ok) {
      throw new Error('GitHub API Limit exceeded or Error');
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("GitHub search error:", error);
    return [];
  }
};

export const getTrendingRepos = async (period: 'daily' | 'weekly' | 'monthly' = 'daily', language: string = ''): Promise<GitHubRepo[]> => {
  // Simulate GitHub Trending by searching for repositories created recently with high stars.
  // Note: The public GitHub API does not support sorting by "stars gained today", only total stars.
  // Using `created:>` is a good proxy for "New & Trending" projects.
  
  const date = new Date();
  switch (period) {
    case 'daily':
      date.setDate(date.getDate() - 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() - 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() - 1);
      break;
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const langQuery = language && language !== 'All' ? `+language:${encodeURIComponent(language)}` : '';
  
  // Query: Created after date, filtered by language, sorted by stars
  const query = `created:>${dateStr}${langQuery}`;

  try {
    const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=9`);
    if (!response.ok) throw new Error('Failed to fetch trending');
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Trending fetch error:", error);
    return [];
  }
}

export const getRepoContents = async (fullName: string, path: string = ''): Promise<FileNode[]> => {
  if (!fullName) return [];

  // Remove leading slash if present to avoid double slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = cleanPath 
    ? `https://api.github.com/repos/${fullName}/contents/${cleanPath}`
    : `https://api.github.com/repos/${fullName}/contents`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        sha: item.sha,
        url: item.url,
        download_url: item.download_url
      })).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });
    }
    return [];
  } catch (error) {
    console.error("GitHub content error:", error);
    return [];
  }
};

export const getFileContent = async (downloadUrl: string): Promise<string> => {
   try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error('Failed to fetch file content');
    return await response.text();
  } catch (error) {
    console.error("File content error:", error);
    return "// 无法加载文件内容，可能是由于网络问题或跨域限制。";
  }
};