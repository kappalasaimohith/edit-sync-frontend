// components/DocxPreview.tsx
import { useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxPreviewProps {
  content: ArrayBuffer;
}

const DocxPreview: React.FC<DocxPreviewProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      renderAsync(content, containerRef.current)
        .then(() => console.log('DOCX rendered successfully'))
        .catch((error) => console.error('Error rendering DOCX:', error));
    }
  }, [content]);

  return <div ref={containerRef} />;
};

export default DocxPreview;
