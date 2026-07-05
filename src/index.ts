import type { ShippingLabel } from "./types/label";
import { printA4Labels } from "./a4-printer";
import { printLabelsViaService } from "./print-service/print-labels";
import type { PrintServiceConfig } from "./print-service/types";
import type { PaperType } from "./types/print";

export type { ShippingLabel } from "./types/label";
export * from "./a4-printer";
export { buildA4LabelHtml, buildA4BulkHtml } from "./a4-label";
export * from "./print-service";
export type { PaperType } from "./types/print";
export { PAPER_SERVICE_MAP } from "./types/print";

export type ShippingInfo = {
  name: string;
  address: string;
  id: string;
};

export type PrintData = {
  id: string;
  uuid: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity?: string;
  senderName: string;
  senderAddress?: string;
  createdAt: string;
  shippingInfo: ShippingInfo;
  companyLogoUrl?: string;
};

export type QDSPrintOptions = {
  /** Paper format (default: A4). */
  paperType?: PaperType;
  /**
   * When set, prints silently via the local print service
   * (e.g. http://localhost:4510) instead of window.print().
   */
  printService?: PrintServiceConfig;
};

/**
 * QDSPrint SDK – handles generation and printing of delivery labels.
 */
export default class QDSPrint {
  private printerName: string;
  private paperType: PaperType;
  private printService?: PrintServiceConfig;

  /**
   * @param printerName Printer name for print-service. Optional for browser A4.
   * @param options paperType and/or printService config. Pass PaperType string for shorthand.
   */
  constructor(printerName = "", options: QDSPrintOptions | PaperType = "A4") {
    this.printerName = printerName;

    const resolved = typeof options === "string" ? { paperType: options } : options;
    this.paperType = resolved.paperType ?? "A4";
    this.printService = resolved.printService;

    if (this.printService && !this.printService.printer && printerName) {
      this.printService = { ...this.printService, printer: printerName };
    }
  }

  getPaperType(): PaperType {
    return this.paperType;
  }

  usesPrintService(): boolean {
    return Boolean(this.printService?.baseUrl);
  }

  async print(data: PrintData): Promise<void> {
    if (this.printService) {
      await this.printViaService(data);
      return;
    }
    await this.printBrowser(data);
  }

  async printBulk(data: PrintData[]): Promise<void> {
    if (this.printService) {
      await this.printViaServiceBulk(data);
      return;
    }
    await this.printBrowserBulk(data);
  }

  async printBrowser(data: PrintData): Promise<void> {
    if (this.paperType === "LABEL_100x150") {
      const { buildLabel100x150BulkHtml } = await import("./print-service/label-100x150");
      const { printHtmlDocument } = await import("./browser-print");
      const html = await buildLabel100x150BulkHtml([this.toLabel(data)]);
      await printHtmlDocument(html, 100, 150);
      return;
    }
    await printA4Labels([this.toLabel(data)]);
  }

  /** @deprecated Use printBrowser */
  async printA4(data: PrintData): Promise<void> {
    await this.printBrowser(data);
  }

  async printBrowserBulk(data: PrintData[]): Promise<void> {
    if (!data.length) return;

    if (this.paperType === "LABEL_100x150") {
      const { buildLabel100x150BulkHtml } = await import("./print-service/label-100x150");
      const { printHtmlDocument } = await import("./browser-print");
      const html = await buildLabel100x150BulkHtml(data.map((d) => this.toLabel(d)));
      await printHtmlDocument(html, 100, 150);
      return;
    }

    await printA4Labels(data.map((item) => this.toLabel(item)));
  }

  /** @deprecated Use printBrowserBulk */
  async printA4Bulk(data: PrintData[]): Promise<void> {
    await this.printBrowserBulk(data);
  }

  async printViaService(data: PrintData): Promise<void> {
    const config = this.requirePrintService();
    await printLabelsViaService(config, this.paperType, [this.toLabel(data)]);
  }

  async printViaServiceBulk(data: PrintData[]): Promise<void> {
    if (!data.length) return;
    const config = this.requirePrintService();
    await printLabelsViaService(config, this.paperType, data.map((d) => this.toLabel(d)));
  }

  private requirePrintService(): PrintServiceConfig {
    if (!this.printService?.baseUrl) {
      throw new Error("printService.baseUrl is required (e.g. http://localhost:4510)");
    }
    return this.printService;
  }

  private toLabel(data: PrintData): ShippingLabel {
    return {
      id: data.id,
      uuid: data.uuid,
      recipientName: data.recipientName,
      recipientAddress: data.recipientAddress,
      recipientCity: data.recipientCity,
      senderName: data.senderName,
      senderAddress: data.senderAddress,
      shippingName: data.shippingInfo.name,
      shippingAddress: data.shippingInfo.address,
      shippingId: data.shippingInfo.id,
      companyLogoUrl: data.companyLogoUrl,
      qrData: data.id,
      createdAtText: this.formatCreatedAt(data.createdAt),
    };
  }

  private formatCreatedAt(value: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toLocaleString("fr", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
