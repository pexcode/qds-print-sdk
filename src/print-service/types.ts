export interface PrinterInfo {
  name: string;
  default: boolean;
}

export type PrintContentType = "html" | "pdf" | "image";

export interface PrintJobPayload {
  printer?: string;
  copies?: number;
  paper?: string;
  contentType: PrintContentType;
  content: string;
}

export interface PrintResponse {
  success: boolean;
  message: string;
  durationMs?: number;
}

export interface PrintServiceConfig {
  /** Base URL */
  baseUrl: string;
  /** Target printer name (optional — service may use default). */
  printer?: string;
  copies?: number;
}

export class PrintServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrintServiceError";
  }
}
