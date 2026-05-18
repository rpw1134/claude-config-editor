import type { ReactNode } from "react";

export interface FieldProps {
  label: string;
  children: ReactNode;
}

export const Field = ({ label, children }: FieldProps) => (
  <div>
    <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
      {label}
    </label>
    {children}
  </div>
);
