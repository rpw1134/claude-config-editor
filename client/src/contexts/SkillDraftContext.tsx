import { createContext, useContext } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type DeleteStatus = "idle" | "confirm" | "deleting" | "error";

export type { SaveStatus, DeleteStatus };

export type SkillDraft = {
  initialized: boolean;
  fileContent: string;
  savedContent: string;
  contentLoading: boolean;
  saveStatus: SaveStatus;
  deleteStatus?: DeleteStatus;
  hasEdits?: boolean;
};

export interface SkillDraftContextValue {
  getDraft: (file: string) => SkillDraft | null;
  setDraft: (file: string, draft: SkillDraft) => void;
  clear: () => void;
}

export const SkillDraftContext =
  createContext<SkillDraftContextValue | null>(null);

export const useSkillDrafts = (): SkillDraftContextValue => {
  const ctx = useContext(SkillDraftContext);
  if (!ctx)
    throw new Error(
      "useSkillDrafts must be used inside SkillDraftContext.Provider",
    );
  return ctx;
};
