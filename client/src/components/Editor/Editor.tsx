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
      // Surfaces — match --bg-base so editor blends seamlessly into the page
      'editor.background': '#0D1119',
      'editorGutter.background': '#0D1119',
      'editorWidget.background': '#1F2430',
      'editorWidget.border': '#ffffff1c',
      'editorSuggestWidget.background': '#1F2430',
      'editorSuggestWidget.border': '#ffffff1c',
      'editorSuggestWidget.selectedBackground': '#ffffff12',

      // Line highlight — very subtle on the dark base
      'editor.lineHighlightBackground': '#ffffff06',
      'editor.lineHighlightBorder': '#00000000',

      // Line numbers — --text-muted (#6B7D96) at reduced opacity
      'editorLineNumber.foreground': '#6B7D9660',
      'editorLineNumber.activeForeground': '#A8B8CC',

      // Text — --text-primary
      'editor.foreground': '#F5F7FA',

      // Cursor — --accent
      'editorCursor.foreground': '#00E5FF',

      // Selection — --accent-dim tinted
      'editor.selectionBackground': '#00E5FF26',
      'editor.inactiveSelectionBackground': '#00E5FF14',
      'editor.selectionHighlightBackground': '#00E5FF14',

      // Find matches
      'editor.findMatchBackground': '#00E5FF40',
      'editor.findMatchHighlightBackground': '#00E5FF20',

      // Indent guides
      'editorIndentGuide.background1': '#ffffff0d',
      'editorIndentGuide.activeBackground1': '#ffffff1a',

      // Scrollbar — matches app scrollbar tokens
      'scrollbarSlider.background': '#ffffff14',
      'scrollbarSlider.hoverBackground': '#ffffff24',
      'scrollbarSlider.activeBackground': '#ffffff30',
    },
  });
};

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  parameterHints: { enabled: false },
  wordBasedSuggestions: 'off' as const,
  hover: { enabled: false },
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
  <div className="w-full h-full flex items-center justify-center bg-[#0D1119]">
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
