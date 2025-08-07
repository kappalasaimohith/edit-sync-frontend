
import { useMemo } from 'react';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const processedContent = useMemo(() => {
    // Basic markdown processing - in a real app you'd use a library like react-markdown
    let processed = content;
    
    // Headers
    processed = processed.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4 text-slate-900 dark:text-gray-100">$1</h1>');
    processed = processed.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mb-3 text-slate-800 dark:text-gray-200">$1</h2>');
    processed = processed.replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mb-2 text-slate-700 dark:text-gray-300">$1</h3>');
    
    // Bold and italic
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    
    // Code blocks
    processed = processed.replace(/```(.+?)```/gs, '<pre class="bg-slate-100 dark:bg-gray-800 p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm font-mono dark:text-gray-100">$1</code></pre>');
    processed = processed.replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm dark:text-gray-100">$1</code>');
    
    // Links
    processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
    
    // Lists
    processed = processed.replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>');
    processed = processed.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1">$1. $2</li>');
    
    // Paragraphs
    processed = processed.replace(/\n\n(.+?)(?=\n\n|$)/gs, '<p class="mb-4 leading-relaxed text-slate-700 dark:text-gray-200">$1</p>');
    
    // Line breaks
    processed = processed.replace(/\n/g, '<br>');
    
    return processed;
  }, [content]);

  if (!content.trim()) {
    return (
      <div className="text-center text-slate-500 py-12">
        <p className="text-lg">Preview will appear here</p>
        <p className="text-sm mt-2">Start typing in the editor to see your content rendered</p>
      </div>
    );
  }

  return (
    <div 
      className="prose prose-slate max-w-none dark:prose-invert p-6 rounded-xl shadow-md bg-white dark:bg-gray-900 border border-border"
      style={{ minHeight: '300px', transition: 'background-color 0.3s, color 0.3s' }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};
