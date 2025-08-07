import { useMemo } from 'react';

interface PlainTextPreviewProps {
  content: string;
}

export const PlainTextPreview = ({ content }: PlainTextPreviewProps) => {
  const formattedContent = useMemo(() => {
    if (!content.trim()) {
      return '';
    }
    
    // Convert line breaks to <br> tags and preserve whitespace
    return content
      .split('\n')
      .map((line, index) => (
        <span key={index}>
          {line}
          {index < content.split('\n').length - 1 && <br />}
        </span>
      ));
  }, [content]);

  if (!content.trim()) {
    return (
      <div className="text-center text-slate-500 py-12">
        <p className="text-lg">Preview will appear here</p>
        <p className="text-sm mt-2">Start typing in the editor to see your content</p>
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap font-mono text-base leading-relaxed text-slate-700 dark:text-gray-200 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-border" style={{ minHeight: '300px', transition: 'background-color 0.3s, color 0.3s' }}>
      {formattedContent}
    </div>
  );
}; 