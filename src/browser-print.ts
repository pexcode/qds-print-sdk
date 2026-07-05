import type { ShippingLabel } from "./types/label";
import { buildA4BulkHtml } from "./a4-label";

export class BrowserPrintNotAvailableError extends Error {
  constructor(message = "Browser printing requires a document and window") {
    super(message);
    this.name = "BrowserPrintNotAvailableError";
  }
}

function waitForDocumentImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  if (!images.length) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Print raw HTML in a hidden iframe. */
export async function printHtmlDocument(
  html: string,
  widthMm: number,
  heightMm: number,
): Promise<void> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    throw new BrowserPrintNotAvailableError();
  }

  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${widthMm}mm;height:${heightMm}mm;border:none;`;

    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const doc = iframe.contentDocument ?? frameWindow?.document;
    if (!frameWindow || !doc) {
      iframe.remove();
      reject(new BrowserPrintNotAvailableError("Unable to create print frame"));
      return;
    }

    let settled = false;
    let printed = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.setTimeout(() => iframe.remove(), 250);
      error ? reject(error) : resolve();
    };

    const triggerPrint = async () => {
      if (printed) return;
      printed = true;
      try {
        await waitForDocumentImages(doc);
        await waitForNextPaint();
        frameWindow.addEventListener("afterprint", () => finish(), { once: true });
        frameWindow.focus();
        frameWindow.print();
        window.setTimeout(() => finish(), 3000);
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    };

    doc.open();
    doc.write(html);
    doc.close();

    if (doc.readyState === "complete") {
      void triggerPrint();
    } else {
      frameWindow.addEventListener("load", () => void triggerPrint(), { once: true });
    }
  });
}

/** @deprecated Use printHtmlDocument or QDSPrint with printService */
export async function printA4Labels(labels: ShippingLabel[]): Promise<void> {
  if (!labels.length) return;
  const html = await buildA4BulkHtml(labels);
  await printHtmlDocument(html, 210, 297);
}
