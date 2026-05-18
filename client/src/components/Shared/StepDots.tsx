interface StepDotsProps {
  total: number;
  current: number;
  onGoTo: (index: number) => void;
}

export const StepDots = ({ total, current, onGoTo }: StepDotsProps) => (
  <div className="flex items-center gap-2.5">
    {Array.from({ length: total }).map((_, i) => {
      const completed = i < current;
      const active = i === current;
      const future = i > current;
      return (
        <button
          key={i}
          disabled={future}
          onClick={() => (completed ? onGoTo(i) : undefined)}
          aria-label={`Step ${i + 1}`}
          className="rounded-full border-none p-0 shrink-0 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
          style={{
            width: active ? 10 : 8,
            height: active ? 10 : 8,
            background: future ? "var(--text-muted)" : "var(--accent)",
            cursor: completed ? "pointer" : "default",
            transition: "width 200ms, height 200ms, background 200ms",
          }}
        />
      );
    })}
  </div>
);
