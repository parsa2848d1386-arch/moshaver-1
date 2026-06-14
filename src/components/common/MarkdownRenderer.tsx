'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

export default function MarkdownRenderer({ text, className }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className || ''}`} style={{ direction: 'rtl', textAlign: 'right' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
