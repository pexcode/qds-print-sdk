import QRCode from "qrcode";
import type { ShippingLabel } from "../types/label";
import { escapeHtml } from "./escape-html";
import { generateBarcodeDataUrl } from "./barcode";

const LABEL_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap");

  @page { size: 100mm 150mm; margin: 0; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    margin: 0;
    padding: 0;
    width: 100mm;
    height: 150mm;
    overflow: hidden;
  }

  body {
    font-family: "Cairo", "Noto Kufi Arabic", Arial, sans-serif;
    direction: rtl;
    text-align: right;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .shipping-label {
    width: 100mm;
    height: 150mm;
    box-sizing: border-box;
    padding: 3mm;
    overflow: hidden;
    page-break-after: always;
    page-break-inside: avoid;
    break-inside: avoid;
    display: flex;
    flex-direction: column;
    gap: 2mm;
  }

  .shipping-label:last-child { page-break-after: auto; }

  .logo { text-align: center; max-height: 12mm; margin-bottom: 1mm; }
  .logo img { max-height: 12mm; max-width: 40mm; object-fit: contain; }

  .section { border-bottom: 0.2mm solid #ccc; padding-bottom: 2mm; }
  .section-title { font-weight: 700; font-size: 3.2mm; margin-bottom: 1mm; color: #333; }
  .field { font-size: 3mm; line-height: 1.35; word-break: break-word; }
  .field strong { font-weight: 700; }

  .codes {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2mm;
    width: 100%;
  }

  .barcode img { display: block; width: 90mm; max-width: 100%; height: auto; }
  .qr img { display: block; width: 22mm; height: 22mm; }
`;

async function buildBody(label: ShippingLabel): Promise<string> {
  const barcodeValue = label.id || label.uuid || "";
  const qrContent = label.qrData ?? label.id;

  const [barcodeDataUrl, qrDataUrl] = await Promise.all([
    generateBarcodeDataUrl(barcodeValue),
    qrContent ? QRCode.toDataURL(qrContent, { width: 200, margin: 1 }) : Promise.resolve(""),
  ]);

  const logoBlock = label.companyLogoUrl
    ? `<div class="logo"><img src="${escapeHtml(label.companyLogoUrl)}" alt="logo" /></div>`
    : "";

  return `
  <div class="shipping-label">
    ${logoBlock}
    <div class="section">
      <div class="section-title">المرسل</div>
      <div class="field"><strong>${escapeHtml(label.senderName)}</strong></div>
      ${label.senderAddress ? `<div class="field">${escapeHtml(label.senderAddress)}</div>` : ""}
    </div>
    <div class="section">
      <div class="section-title">المستلم</div>
      <div class="field"><strong>${escapeHtml(label.recipientName)}</strong></div>
      <div class="field">${escapeHtml(label.recipientAddress)}</div>
      ${label.recipientCity ? `<div class="field"><strong>المدينة:</strong> ${escapeHtml(label.recipientCity)}</div>` : ""}
      <div class="field"><strong>رقم الطلب:</strong> ${escapeHtml(label.id)}</div>
    </div>
    <div class="codes">
      ${barcodeDataUrl ? `<div class="barcode"><img src="${barcodeDataUrl}" alt="barcode" /></div>` : ""}
      ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR" /></div>` : ""}
    </div>
  </div>`;
}

/** Builds a full HTML document for 100×150 mm shipping labels. */
export async function buildLabel100x150BulkHtml(labels: ShippingLabel[]): Promise<string> {
  const bodies = await Promise.all(labels.map((label) => buildBody(label)));
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <style>${LABEL_STYLES}</style>
</head>
<body>${bodies.join("")}</body>
</html>`;
}

export async function buildLabel100x150Html(label: ShippingLabel): Promise<string> {
  return buildLabel100x150BulkHtml([label]);
}
