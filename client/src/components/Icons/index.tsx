// ── Sidebar icons ─────────────────────────────────────────────────────────────

export const DocumentIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 2.5C3 1.67 3.67 1 4.5 1H9L12 4V12.5C12 13.33 11.33 14 10.5 14H4.5C3.67 14 3 13.33 3 12.5V2.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M9 1V4H12"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M5.5 7H9.5M5.5 9.5H9.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);

export const AgentIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="7.5"
      cy="5"
      r="3"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const SkillIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

export const McpIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="1"
      width="13"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M4 7.5H11M7.5 4V11"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export const HooksIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 2.5V8.5C5 10.43 6.57 12 8.5 12C10.43 12 12 10.43 12 8.5V7"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M10 5L12 7L14 5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M3 2.5H7"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 13 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.5 1.5V11.5M1.5 6.5H11.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const ChevronIcon = ({
  direction = "left",
}: {
  direction?: "left" | "right";
}) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={direction === "right" ? "rotate-180" : undefined}
  >
    <path
      d="M7.5 2L4 6L7.5 10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── AgentCreateFlow icons ─────────────────────────────────────────────────────

export const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M3 5L7 9L11 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6L5 9L10 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M3 7H11M8 4L11 7L8 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3 3L13 13M13 3L3 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const EyeIcon = ({ crossed }: { crossed: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    {crossed && (
      <line
        x1="2"
        y1="2"
        x2="14"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    )}
  </svg>
);

// ── McpEditorPane icon ────────────────────────────────────────────────────────

export const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M9 2L4 7L9 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── McpCreateModal icon ───────────────────────────────────────────────────────

export const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M1.293 1.293a1 1 0 0 1 1.414 0L7 5.586l4.293-4.293a1 1 0 1 1 1.414 1.414L8.414 7l4.293 4.293a1 1 0 0 1-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L5.586 7 1.293 2.707a1 1 0 0 1 0-1.414z" />
  </svg>
);

export const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 3L9.5 7L5.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BackArrowIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.5 2.5L4 7L8.5 11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SidebarCloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.25" y="2.25" width="13.5" height="11.5" rx="2" stroke="currentColor" strokeWidth="1.25"/>
    <path d="M5.5 2.5V13.5" stroke="currentColor" strokeWidth="1.25"/>
    <path d="M10.5 6.5L8.5 8L10.5 9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const StrydeLogoIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="175 163 250 275"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Stryde"
  >
    <defs>
      <linearGradient id="sli-t-top" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#B2FFFF"/><stop offset="100%" stopColor="#00E5FF"/></linearGradient>
      <linearGradient id="sli-t-left" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#00CBE2"/><stop offset="100%" stopColor="#008396"/></linearGradient>
      <linearGradient id="sli-t-right" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00E5FF"/><stop offset="100%" stopColor="#005B6B"/></linearGradient>
      <linearGradient id="sli-m-top" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#D4C4FF"/><stop offset="100%" stopColor="#9975FF"/></linearGradient>
      <linearGradient id="sli-m-left" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8052FF"/><stop offset="100%" stopColor="#552BC6"/></linearGradient>
      <linearGradient id="sli-m-right" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9975FF"/><stop offset="100%" stopColor="#3D1A9E"/></linearGradient>
      <linearGradient id="sli-v-top" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E7DBFF"/><stop offset="100%" stopColor="#7C4DFF"/></linearGradient>
      <linearGradient id="sli-v-left" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#6430FF"/><stop offset="100%" stopColor="#4213CC"/></linearGradient>
      <linearGradient id="sli-v-right" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7C4DFF"/><stop offset="100%" stopColor="#2D069E"/></linearGradient>
    </defs>
    <g transform="translate(300, 270)">
      <g>
        <polygon points="0.0,-101.2 39.8,-78.2 0.0,-55.2 -39.8,-78.2" fill="url(#sli-v-top)" />
        <polygon points="-39.8,-78.2 0.0,-55.2 0.0,-9.2 -39.8,-32.2" fill="url(#sli-v-left)" />
        <polygon points="0.0,-55.2 39.8,-78.2 39.8,-32.2 0.0,-9.2" fill="url(#sli-v-right)" />
      </g>
      <g>
        <polygon points="39.8,-39.1 79.7,-16.1 39.8,6.9 0.0,-16.1" fill="url(#sli-m-top)" />
        <polygon points="0.0,-16.1 39.8,6.9 39.8,52.9 0.0,29.9" fill="url(#sli-m-left)" />
        <polygon points="39.8,6.9 79.7,-16.1 79.7,29.9 39.8,52.9" fill="url(#sli-m-right)" />
      </g>
      <g>
        <polygon points="-39.8,-39.1 0.0,-16.1 -39.8,6.9 -79.7,-16.1" fill="url(#sli-m-top)" />
        <polygon points="-79.7,-16.1 -39.8,6.9 -39.8,52.9 -79.7,29.9" fill="url(#sli-m-left)" />
        <polygon points="-39.8,6.9 0.0,-16.1 0.0,29.9 -39.8,52.9" fill="url(#sli-m-right)" />
      </g>
      <g>
        <polygon points="79.7,23.0 119.5,46.0 79.7,69.0 39.8,46.0" fill="url(#sli-t-top)" />
        <polygon points="39.8,46.0 79.7,69.0 79.7,115.0 39.8,92.0" fill="url(#sli-t-left)" />
        <polygon points="79.7,69.0 119.5,46.0 119.5,92.0 79.7,115.0" fill="url(#sli-t-right)" />
      </g>
      <g>
        <polygon points="-79.7,23.0 -39.8,46.0 -79.7,69.0 -119.5,46.0" fill="url(#sli-t-top)" />
        <polygon points="-119.5,46.0 -79.7,69.0 -79.7,115.0 -119.5,92.0" fill="url(#sli-t-left)" />
        <polygon points="-79.7,69.0 -39.8,46.0 -39.8,92.0 -79.7,115.0" fill="url(#sli-t-right)" />
      </g>
      <g>
        <polygon points="0.0,-16.1 39.8,6.9 0.0,29.9 -39.8,6.9" fill="url(#sli-m-top)" />
        <polygon points="-39.8,6.9 0.0,29.9 0.0,75.9 -39.8,52.9" fill="url(#sli-m-left)" />
        <polygon points="0.0,29.9 39.8,6.9 39.8,52.9 0.0,75.9" fill="url(#sli-m-right)" />
      </g>
      <g>
        <polygon points="39.8,46.0 79.7,69.0 39.8,92.0 0.0,69.0" fill="url(#sli-t-top)" />
        <polygon points="0.0,69.0 39.8,92.0 39.8,138.0 0.0,115.0" fill="url(#sli-t-left)" />
        <polygon points="39.8,92.0 79.7,69.0 79.7,115.0 39.8,138.0" fill="url(#sli-t-right)" />
      </g>
      <g>
        <polygon points="-39.8,46.0 0.0,69.0 -39.8,92.0 -79.7,69.0" fill="url(#sli-t-top)" />
        <polygon points="-79.7,69.0 -39.8,92.0 -39.8,138.0 -79.7,115.0" fill="url(#sli-t-left)" />
        <polygon points="-39.8,92.0 0.0,69.0 0.0,115.0 -39.8,138.0" fill="url(#sli-t-right)" />
      </g>
      <g>
        <polygon points="0.0,69.0 39.8,92.0 0.0,115.0 -39.8,92.0" fill="url(#sli-t-top)" />
        <polygon points="-39.8,92.0 0.0,115.0 0.0,161.0 -39.8,138.0" fill="url(#sli-t-left)" />
        <polygon points="0.0,115.0 39.8,92.0 39.8,138.0 0.0,161.0" fill="url(#sli-t-right)" />
      </g>
    </g>
  </svg>
);
