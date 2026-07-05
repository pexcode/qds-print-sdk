/**
 * Vue / web app integration examples for the local print service.
 * Copy these helpers into your frontend project, or import from the SDK:
 *
 *   import { getPrinters, printJob, printLabelsViaService } from "@pexcode/qds-print-sdk/print-service";
 */

import type {
  PrintJobPayload,
  PrintResponse,
  PrintServiceConfig,
  PrinterInfo,
} from "../src/print-service/types";
import {
  getPrinters,
  printHtmlLabel,
  printImageBase64,
  printJob,
  printPdfBase64,
} from "../src/print-service/client";
import { printLabelsViaService } from "../src/print-service/print-labels";
import type { PrintData } from "../src/index";
import QDSPrint from "../src/index";

export const DEFAULT_PRINT_SERVICE_URL = "http://localhost:4510";

export type { PrinterInfo, PrintJobPayload, PrintResponse, PrintServiceConfig };

export { getPrinters, printJob, printHtmlLabel, printPdfBase64, printImageBase64, printLabelsViaService };

/** Example: print HTML label silently on 100×150 mm */
export async function printHtmlLabelExample(
  html: string,
  printer = "Zebra ZD421",
  baseUrl = DEFAULT_PRINT_SERVICE_URL,
): Promise<void> {
  await printHtmlLabel(
    { baseUrl, printer },
    html,
    "100x150",
  );
}

/** Example: print base64 PDF */
export async function printPdfBase64Example(
  base64Pdf: string,
  printer?: string,
  baseUrl = DEFAULT_PRINT_SERVICE_URL,
): Promise<void> {
  await printPdfBase64({ baseUrl, printer }, base64Pdf);
}

/** Example: print base64 PNG/JPG */
export async function printImageBase64Example(
  base64Image: string,
  printer?: string,
  baseUrl = DEFAULT_PRINT_SERVICE_URL,
): Promise<void> {
  await printImageBase64({ baseUrl, printer }, base64Image, "100x150");
}

/** Example: print QDS label data via print service (100×150) */
export async function printShippingLabel(
  data: PrintData,
  printer: string,
  baseUrl = DEFAULT_PRINT_SERVICE_URL,
): Promise<void> {
  const qds = new QDSPrint(printer, {
    paperType: "LABEL_100x150",
    printService: { baseUrl, printer },
  });
  await qds.print(data);
}

/** Example: print QDS label data on A4 via print service */
export async function printA4Document(
  data: PrintData,
  printer?: string,
  baseUrl = DEFAULT_PRINT_SERVICE_URL,
): Promise<void> {
  const qds = new QDSPrint(printer ?? "", {
    paperType: "A4",
    printService: { baseUrl, printer },
  });
  await qds.print(data);
}

/**
 * Vue 3 composable example:
 *
 * ```ts
 * import { ref, onMounted } from "vue";
 * import { getPrinters, printJob } from "@pexcode/qds-print-sdk/print-service";
 * import type { PrinterInfo } from "@pexcode/qds-print-sdk/print-service";
 *
 * const PRINT_SERVICE_URL = "http://localhost:4510";
 *
 * export function usePrintService() {
 *   const printers = ref<PrinterInfo[]>([]);
 *   const loading = ref(false);
 *   const error = ref<string | null>(null);
 *
 *   onMounted(async () => {
 *     try {
 *       printers.value = await getPrinters(PRINT_SERVICE_URL);
 *     } catch (e) {
 *       error.value = e instanceof Error ? e.message : "Failed to load printers";
 *     }
 *   });
 *
 *   async function printHtml(html: string, printer?: string, paper = "100x150") {
 *     loading.value = true;
 *     error.value = null;
 *     try {
 *       await printJob(PRINT_SERVICE_URL, {
 *         contentType: "html",
 *         content: html,
 *         printer,
 *         paper,
 *       });
 *     } catch (e) {
 *       error.value = e instanceof Error ? e.message : "Print failed";
 *     } finally {
 *       loading.value = false;
 *     }
 *   }
 *
 *   return { printers, loading, error, printHtml };
 * }
 * ```
 *
 * With QDSPrint + print service:
 *
 * ```ts
 * import QDSPrint, { type PrintData } from "@pexcode/qds-print-sdk";
 *
 * const printer = new QDSPrint("Zebra ZD421", {
 *   paperType: "LABEL_100x150",
 *   printService: { baseUrl: "http://localhost:4510", printer: "Zebra ZD421" },
 * });
 *
 * await printer.print(orderData);
 * ```
 */
