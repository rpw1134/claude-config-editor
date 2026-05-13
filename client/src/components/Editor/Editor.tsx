import MonacoEditor, {
  type BeforeMount,
  type OnChange,
} from '@monaco-editor/react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

const beforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('app-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0d0d10',
      'editor.lineHighlightBackground': '#00000000',
      'editorLineNumber.foreground': '#ffffff18',
      'editorLineNumber.activeForeground': '#ffffff35',
    },
  });
};

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: 22,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  padding: { top: 16, bottom: 16 },
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  renderLineHighlight: 'none' as const,
  overviewRulerLanes: 0,
};

const LoadingPlaceholder = () => (
  <div className="w-full h-full flex items-center justify-center bg-[#0d0d10]">
    <span className="text-[12px] font-mono text-white/25">Loading editor…</span>
  </div>
);

export const Editor = ({
  value,
  onChange,
  language = 'markdown',
  readOnly = false,
}: EditorProps) => {
  const handleChange: OnChange = (newValue) => {
    onChange(newValue ?? '');
  };

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      theme="app-dark"
      options={{ ...EDITOR_OPTIONS, readOnly }}
      beforeMount={beforeMount}
      onChange={handleChange}
      loading={<LoadingPlaceholder />}
    />
  );
};
