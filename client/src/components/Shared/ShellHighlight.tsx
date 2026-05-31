import { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);

type Lang = "bash" | "python" | "javascript";

interface Extracted {
  code: string;
  language: Lang;
  label: string;
}

function extract(raw: string): Extracted {
  // Shebang
  if (raw.trimStart().startsWith("#!")) {
    const line = raw.split("\n")[0];
    if (/python/.test(line)) return { code: raw, language: "python", label: "python" };
    if (/node|deno/.test(line)) return { code: raw, language: "javascript", label: "javascript" };
    return { code: raw, language: "bash", label: "sh" };
  }

  // python3 -c "..." or python -c "..."
  const pyMatch = raw.match(/^python3?\s+-c\s+"([\s\S]+)"[\n\s]*$/);
  if (pyMatch) return { code: pyMatch[1], language: "python", label: "python" };

  // node -e "..."
  const nodeMatch = raw.match(/^node\s+-e\s+"([\s\S]+)"[\n\s]*$/);
  if (nodeMatch) return { code: nodeMatch[1], language: "javascript", label: "javascript" };

  return { code: raw, language: "bash", label: "sh" };
}

interface ShellHighlightProps {
  code: string;
  className?: string;
}

export const ShellHighlight = ({ code, className = "" }: ShellHighlightProps) => {
  const { code: extracted, language, label } = useMemo(() => extract(code), [code]);
  const highlighted = useMemo(
    () => hljs.highlight(extracted, { language }).value,
    [extracted, language]
  );

  return (
    <div className={`relative ${className}`}>
      <span className="absolute top-0 right-0 text-[10px] font-semibold uppercase tracking-widest text-(--text-muted) select-none">
        {label}
      </span>
      <pre
        className="m-0 text-[12px] font-['Fira_Code',monospace] leading-relaxed whitespace-pre-wrap break-all hljs-stryde"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
};
