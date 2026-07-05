import type {
  PrintJobPayload,
  PrintResponse,
  PrintServiceConfig,
  PrinterInfo,
} from "./types";
import { PrintServiceError } from "./types";

function serviceUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

/**
 * Fetch installed printers from the local print service.
 */
export async function getPrinters(baseUrl: string): Promise<PrinterInfo[]> {
  const response = await fetch(serviceUrl(baseUrl, "/printers"));
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as PrintResponse;
    throw new PrintServiceError(error.message ?? "Failed to fetch printers");
  }
  return response.json() as Promise<PrinterInfo[]>;
}

/**
 * Send a print job to the local print service.
 */
export async function printJob(
  baseUrl: string,
  payload: PrintJobPayload,
): Promise<PrintResponse> {
  const response = await fetch(serviceUrl(baseUrl, "/print"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as PrintResponse;
  if (!response.ok || !result.success) {
    throw new PrintServiceError(result.message ?? "Print failed");
  }
  return result;
}

/** Print HTML label silently via the print service. */
export async function printHtmlLabel(
  config: PrintServiceConfig,
  html: string,
  paper = "100x150",
): Promise<PrintResponse> {
  return printJob(config.baseUrl, {
    printer: config.printer,
    copies: config.copies ?? 1,
    paper,
    contentType: "html",
    content: html,
  });
}

/** Print base64 PDF via the print service. */
export async function printPdfBase64(
  config: PrintServiceConfig,
  base64Pdf: string,
): Promise<PrintResponse> {
  return printJob(config.baseUrl, {
    printer: config.printer,
    copies: config.copies ?? 1,
    contentType: "pdf",
    content: base64Pdf,
  });
}

/** Print base64 PNG/JPG image via the print service. */
export async function printImageBase64(
  config: PrintServiceConfig,
  base64Image: string,
  paper = "100x150",
): Promise<PrintResponse> {
  return printJob(config.baseUrl, {
    printer: config.printer,
    copies: config.copies ?? 1,
    paper,
    contentType: "image",
    content: base64Image,
  });
}
