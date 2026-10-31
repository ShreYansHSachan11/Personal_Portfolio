import type { ComponentType } from "react";
import { FaqArt } from "./art/FaqArt";
import { GuardianArt } from "./art/GuardianArt";
import { NextHireArt } from "./art/NextHireArt";
import { SherlockArt } from "./art/SherlockArt";
import type { ProjectArt } from "./content";

const ART: Record<ProjectArt, ComponentType> = {
  redaction: SherlockArt,
  embedding: NextHireArt,
  ledger: GuardianArt,
  translation: FaqArt,
};

/** Interactive, decorative project artwork: purely visual, so it is hidden from assistive tech. */
export function ProjectPreview({ art, large = false }: { art: ProjectArt; large?: boolean }) {
  const Art = ART[art];
  return (
    <div className={`project-preview preview-${art} ${large ? "preview-large" : ""}`} aria-hidden="true">
      <Art />
    </div>
  );
}
