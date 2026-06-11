'use client';

import { renderMarkdown } from '@/utils/format';

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

export default function MarkdownRenderer({ text, className }: MarkdownRendererProps) {
  const html = renderMarkdown(text);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
