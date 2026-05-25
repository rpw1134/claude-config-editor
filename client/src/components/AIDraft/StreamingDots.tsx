// Three pulsing dots that indicate the assistant is streaming a response.

export const StreamingDots = () => (
  <div className="flex items-center gap-1.5 px-1 py-2">
    <span
      className="w-1.5 h-1.5 rounded-full bg-(--text-muted) animate-pulse"
      style={{ animationDelay: "0ms", animationDuration: "1.2s" }}
    />
    <span
      className="w-1.5 h-1.5 rounded-full bg-(--text-muted) animate-pulse"
      style={{ animationDelay: "200ms", animationDuration: "1.2s" }}
    />
    <span
      className="w-1.5 h-1.5 rounded-full bg-(--text-muted) animate-pulse"
      style={{ animationDelay: "400ms", animationDuration: "1.2s" }}
    />
  </div>
);
