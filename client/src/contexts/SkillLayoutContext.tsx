import { createContext, useContext } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SkillLayoutContextValue {
  reportDirty: (file: string, isDirty: boolean) => void;
  registerSaveHandler: (file: string, fn: () => Promise<void>) => void;
  unregisterSaveHandler: (file: string) => void;
  previewMode: boolean;
  isSaving: boolean;
  setPreviewMode: (val: boolean) => void;
}

export const SkillLayoutContext =
  createContext<SkillLayoutContextValue | null>(null);

export const useSkillLayout = (): SkillLayoutContextValue => {
  const ctx = useContext(SkillLayoutContext);
  if (!ctx)
    throw new Error(
      "useSkillLayout must be inside SkillLayoutContext.Provider",
    );
  return ctx;
};
