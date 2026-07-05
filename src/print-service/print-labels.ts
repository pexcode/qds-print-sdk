import type { PaperType } from "../types/print";
import { PAPER_SERVICE_MAP } from "../types/print";
import type { ShippingLabel } from "../types/label";
import { buildA4BulkHtml } from "../a4-label";
import { buildLabel100x150BulkHtml } from "./label-100x150";
import { printHtmlLabel } from "./client";
import type { PrintServiceConfig, PrintResponse } from "./types";

/**
 * Build HTML for the given paper type.
 * Add new layouts here when extending PaperType.
 */
export async function buildPrintHtml(
  paperType: PaperType,
  labels: ShippingLabel[],
): Promise<string> {
  switch (paperType) {
    case "A4":
      return buildA4BulkHtml(labels);
    case "LABEL_100x150":
      return buildLabel100x150BulkHtml(labels);
    default: {
      const _exhaustive: never = paperType;
      throw new Error(`Unsupported paper type: ${_exhaustive}`);
    }
  }
}

/**
 * Print one or more labels via the local print service (silent print).
 */
export async function printLabelsViaService(
  config: PrintServiceConfig,
  paperType: PaperType,
  labels: ShippingLabel[],
): Promise<PrintResponse> {
  if (!labels.length) {
    throw new Error("No labels to print");
  }

  const html = await buildPrintHtml(paperType, labels);
  const paper = PAPER_SERVICE_MAP[paperType];

  return printHtmlLabel(config, html, paper);
}
