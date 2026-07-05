/** Browser paper formats — add new label sizes here (e.g. LABEL_80x80). */
export type PaperType = "A4" | "LABEL_100x150";

/** Maps SDK paperType to print-service `paper` field. */
export const PAPER_SERVICE_MAP: Record<PaperType, string> = {
  A4: "A4",
  LABEL_100x150: "100x150",
};
