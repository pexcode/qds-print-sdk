import QRCode from "qrcode";
import type { ShippingLabel } from "./types/label";

function escapeHtml(text: string | undefined | null): string {
  if (text == null) {
    return "";
  }
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrintedAt(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

const A4_STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    color: #000;
    line-height: 1.35;
  }
  .label-page {
    page-break-after: always;
  }
  .label-page:last-child {
    page-break-after: auto;
  }
  .print-meta {
    text-align: center;
    font-size: 9pt;
    color: #333;
    margin-bottom: 10px;
  }
  .label-box {
    border: 1px solid #000;
    padding: 14px 18px;
    max-width: 100%;
  }
  .row {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .col {
    flex: 1;
    min-width: 0;
  }
  .ship-to-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .corner-frame {
    position: relative;
    padding: 14px 16px;
    margin-top: 2px;
  }
  .corner {
    position: absolute;
    width: 22px;
    height: 22px;
    border-color: #000;
    border-style: solid;
  }
  .corner.tl {
    top: 0;
    left: 0;
    border-width: 2px 0 0 2px;
  }
  .corner.tr {
    top: 0;
    right: 0;
    border-width: 2px 2px 0 0;
  }
  .corner.bl {
    bottom: 0;
    left: 0;
    border-width: 0 0 2px 2px;
  }
  .corner.br {
    bottom: 0;
    right: 0;
    border-width: 0 2px 2px 0;
  }
  .section-title {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 8px;
  }
  .name {
    font-weight: bold;
    margin-bottom: 2px;
  }
  .line {
    margin-bottom: 2px;
    word-break: break-word;
  }
  .divider {
    border-top: 1px solid #ccc;
    margin: 14px 0;
  }
  .track-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .qr img {
    display: block;
    width: 150px;
    height: 150px;
  }
  .footer-id {
    text-align: center;
    font-weight: bold;
    margin-top: 18px;
    font-size: 11pt;
    word-break: break-all;
  }
`;

async function buildLabelBody(label: ShippingLabel): Promise<string> {
  const qrContent = label.qrData ?? label.id;
  const qrDataUrl = qrContent
    ? await QRCode.toDataURL(qrContent, { width: 150, margin: 1 })
    : "";

  const senderAddressBlock = label.senderAddress
    ? `<div class="line">${escapeHtml(label.senderAddress)}</div>`
    : "";

  const dateBlock = label.createdAtText
    ? `<div class="line">Date: ${escapeHtml(label.createdAtText)}</div>`
    : "";

  const qrBlock = qrDataUrl
    ? `<div class="qr"><img src="${qrDataUrl}" alt="QR code" width="150" height="150" /></div>`
    : "";

  const footerBlock =  
    `<div class="footer-id">${escapeHtml(label.id)}</div>`

  return `
  <div class="label-page">
    <div class="label-box">
      <div class="row">
        <div class="col">
          <div class="section-title">SENDER</div>
          <div class="name">${escapeHtml(label.senderName)}</div>
          ${senderAddressBlock}
          ${dateBlock}
        </div>
        </div>
        <br/>
      <div class="row">
        <div class="col ship-to-col">
          <div class="section-title">SHIP TO</div>
          <div class="corner-frame">
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <span class="corner br"></span>
            <div class="name">${escapeHtml(label.recipientName)}</div>
            <div class="line">${escapeHtml(label.recipientAddress)}</div>
            <div class="line">ID: ${escapeHtml(label.uuid)}</div>
          </div>
        </div>
        
      </div>

      <div class="divider"></div>

      <div class="row">
      <div class="  track-col"> 
       ${qrBlock} 
        </div>
        <div class="col">
          <div class="section-title">PROCESS</div>
          <div class="name">${escapeHtml(label.shippingName)}</div>
          <div class="line">${escapeHtml(label.shippingAddress)}</div>
          <div class="line">ID: ${escapeHtml(label.shippingId)}</div>
        </div>
      </div>

      ${footerBlock}
    </div>
  </div>`;
}

/**
 * Builds an HTML document for printing a shipping label on A4 paper.
 */
export async function buildA4LabelHtml(label: ShippingLabel): Promise<string> {
  return buildA4BulkHtml([label]);
}

/**
 * Builds an HTML document with one label per A4 page.
 */
export async function buildA4BulkHtml(labels: ShippingLabel[]): Promise<string> {
  const bodies = await Promise.all(labels.map((label) => buildLabelBody(label)));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${A4_STYLES}</style>
</head>
<body>
  ${bodies.join("")}
</body>
</html>`;
}
