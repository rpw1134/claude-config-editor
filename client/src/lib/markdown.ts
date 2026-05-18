// Lightweight markdown-to-HTML converter. Handles the common subset needed for
// system prompts: fenced code blocks, headings, bold, italic, inline code,
// unordered lists, and paragraphs. Does NOT sanitize — used only for local
// content typed by the user in this session.
export function renderMarkdown(md: string): string {
  let html = md;

  // Fenced code blocks (``` ... ```)
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre style="background:var(--bg-hover);border:1px solid var(--border-subtle);border-radius:8px;padding:12px 14px;overflow-x:auto;font-family:'Fira Code',monospace;font-size:13px;line-height:1.5;margin:12px 0"><code>${escaped}</code></pre>`;
  });

  // Split into lines for block-level processing
  const lines = html.split("\n");
  const out: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Already-processed HTML blocks (pre) — pass through
    if (line.startsWith("<pre")) {
      out.push(line);
      inList = false;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h3) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(
        `<h3 style="font-size:15px;font-weight:600;margin:16px 0 6px">${h3[1]}</h3>`,
      );
      continue;
    }
    if (h2) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(
        `<h2 style="font-size:18px;font-weight:700;margin:20px 0 8px">${h2[1]}</h2>`,
      );
      continue;
    }
    if (h1) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(
        `<h1 style="font-size:22px;font-weight:700;margin:20px 0 8px">${h1[1]}</h1>`,
      );
      continue;
    }

    // Unordered list items
    const li = line.match(/^[-*] (.+)/);
    if (li) {
      if (!inList) {
        out.push('<ul style="margin:8px 0 8px 20px;padding:0">');
        inList = true;
      }
      out.push(`<li style="margin:3px 0">${inlineMarkdown(li[1])}</li>`);
      continue;
    }

    // Close list on non-list line
    if (inList) {
      out.push("</ul>");
      inList = false;
    }

    // Blank line → paragraph break
    if (line.trim() === "") {
      out.push("<br>");
      continue;
    }

    // Regular paragraph line
    out.push(`<p style="margin:0 0 6px">${inlineMarkdown(line)}</p>`);
  }

  if (inList) out.push("</ul>");

  return out.join("\n");
}

export function inlineMarkdown(text: string): string {
  // Inline code
  text = text.replace(
    /`([^`]+)`/g,
    `<code style="font-family:'Fira Code',monospace;font-size:0.9em;background:var(--bg-hover);border:1px solid var(--border-subtle);border-radius:4px;padding:1px 5px">$1</code>`,
  );
  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text;
}
