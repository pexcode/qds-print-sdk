import QR from "./QR-code";

function subStringDate(value: string): string {
  return new Date(value).toLocaleString("fr", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Shipment and printing data types */
type ShippingInfo = {
  name: string;
  address: string;
  id: string;
}

type PrintData = {
  id: string;
  uuid: string;
  dest_name: string;
  dest_address: string;
  sender_name: string;
  sender_address?: string;
  created_at: string;
  shipping: ShippingInfo;
}

type QRResult = {
  id: string;
  qr: string;
}

/**
 * QDSPrint SDK – handles generation and printing of delivery labels.
 */
export default class QDSPrint {
  private qrService = new QR();

  /**
   * Print multiple labels in a single print job.
   */
  async printBulk(data: PrintData[]): Promise<void> {
    if (!data.length) {
      console.warn("printBulk called with empty data");
      return;
    }

    try {
      const qrList = await this.buildQRs(data);
      await this.renderAndPrint(data, qrList);
    } catch (error) {
      console.error("Bulk print failed:", error);
    }
  }

  /**
   * Print a single label.
   */
  async print(data: PrintData): Promise<void> {
    try {
      const qrList = await this.buildQRs([data]);
      await this.renderAndPrint([data], qrList);
    } catch (error) {
      console.error("Single print failed:", error);
    }
  }

  /**
   * Generate QR codes in parallel.
   */
  private async buildQRs(data: PrintData[]): Promise<QRResult[]> {
    return Promise.all(
      data.map(async (item) => ({
        id: item.id,
        qr: await this.qrService.qrBuild(item.id),
      }))
    );
  }

  /**
   * Writes HTML to iframe and triggers printing.
   */
  private async renderAndPrint(
    data: PrintData[],
    qrList: QRResult[]
  ): Promise<void> {
    const iframe = document.getElementById("printf") as HTMLIFrameElement | null;

    if (!iframe?.contentWindow) {
      throw new Error("Print iframe not found");
    }

    const html = await this.html(data, qrList);
    const win = iframe.contentWindow;

    win.document.open();
    win.document.write(html);
    win.document.close();

    win.onload = () => win.print();
  }

  /**
   * Generates the printable HTML layout.
   */
  private async html(
    data: PrintData[],
    qrList: QRResult[]
  ): Promise<string> {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8" />
      <title>QuickDeliverySystem - Labels</title>
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        .container {
          width: 600px;
          border: 1px solid #000;
          margin: 0 auto 24px auto;
          padding: 16px;
          page-break-after: always;
        }
        .header {
          text-align: center;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .content {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #ccc;
          padding-top: 8px;
          margin-top: 8px;
        }
        .left-section, .right-section {
          width: 48%;
        }
        h2 {
          font-size: 14px;
          margin-bottom: 4px;
        }
        .barcode-section {
          text-align: center;
          margin-top: 12px;
          font-weight: bold;
          letter-spacing: 2px;
        }
      </style>
      </head>
      <body>
      ${this.body(data, qrList)}
      </body>
      </html>`;
  }

  /**
   * Builds label body.
   */
  private body(
    printList: PrintData[],
    qrList: QRResult[]
  ): string {
    return printList
      .map((item) => {
        const qr = qrList.find((x) => x.id === item.id)?.qr ?? "";

        return `
    <div class="container">
      <div class="header">
        Printed at ${new Date().toLocaleString()} — quickdeliverysystem.com
      </div>

      <div class="content">
        <div class="left-section">
          <h2>SHIP TO</h2>
          <strong>${item.dest_name}</strong>
          <p>${item.dest_address}</p>
          <p>ID: ${item.uuid}</p>
        </div>
        <div class="right-section">
          <h2>TRACK</h2>
          <img src="${qr}" width="160" height="160" />
        </div>
      </div>

      <div class="content">
        <div class="left-section">
          <h2>SENDER</h2>
          <strong>${item.sender_name}</strong>
          <p>${item.sender_address}</p>
          <p>Date: ${subStringDate(item.created_at)}</p>
        </div>
        <div class="right-section">
          <h2>PROCESS</h2>
          <strong>${item.shipping.name}</strong>
          <p>${item.shipping.address}</p>
          <p>ID: ${item.shipping.id}</p>
        </div>
      </div>

      <div class="barcode-section">
        ${item.id}
      </div>
    </div>`;
      })
      .join("");
  }
}
