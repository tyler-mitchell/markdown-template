import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: false, linkify: true });

export function DocumentPreview({ content }: { content: string }) {
  return (
    <article
      className="prose prose-zinc max-w-none p-6 dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: markdown.render(content) }}
    />
  );
}
