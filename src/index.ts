import QR from "./QR-code"

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
  sender_address: string;
  created_at: string;
  shipping: ShippingInfo;
}

type QRResult = {
  barcode: string;
  track: string;
}

/**
 * QDSPrint SDK – handles generation and printing of delivery labels with QR codes and barcodes.
 */
export default class QDSPrint {
  private trackURL: string = "https://example.com"
  constructor(domain: string) {
    this.trackURL = domain
  }
  /**
   * Builds QR and barcode, injects the HTML into an iframe, and triggers the print dialog.
   */
  async printBulk(data: PrintData[]): Promise<void> {
    throw ("not ready")
  }

  async print(data: PrintData): Promise<void> {
    const qc = new QR();
    const qr: QRResult = { barcode: "", track: "" };

    try {
      // Generate barcode (sync)
      qr.barcode = qc.barBuild(data.id);

      // Generate QR code (async)
      qr.track = await qc.qrBuild(`${this.trackURL}?uuid=${data.uuid}`);

      // Find iframe for printing
      const iframe = document.getElementById("printf") as HTMLIFrameElement | null;
      const newWin = iframe?.contentWindow;
      if (!newWin) {
        console.error("Error: Iframe not found.");
        return;
      }

      const htmlContent = await this.html(data, qr);
      newWin.document.write(htmlContent);
      newWin.document.close();

      // Wait for iframe to load before printing=======
      newWin.onload = () => {
        newWin.print();
      };
    } catch (err) {
      console.error("Error during printing:", err);
    }
  }

  /**
   * Generates the printable HTML layout.
   */
  private async html(data: PrintData, qr: QRResult): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QuickDeliverySystem - Label</title>
    <style>
      .container {
        width: 600px;
        border: 1px solid black;
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        font-family: sans-serif;
      }
      .header,
      .content,
      .barcode-section {
        padding: 0.5rem;
        border-bottom: 1px solid lightgray;
      }
      .header { text-align: center; }
      .content { display: flex; flex-direction: row; }
      .left-section, .right-section { flex: 1; }
      .barcode-section { text-align: center; }
      .barcode-section img { width: 100%; }
      .footer { text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p>Printed at: ${new Date().toLocaleString()} by quickdeliverysystem.com</p>
      </div>

      <div class="content">
        <div class="left-section">
          <h2>SHIP TO</h2>
          <b>${data.dest_name}</b>
          <p>${data.dest_address}</p>
          <p>ID: ${data.uuid}</p>
        </div>
        <div class="right-section">
          <h2>Track Package</h2>
          <img src="${qr.track}" style="width:160px;height:160px;" />
        </div>
      </div>

      <div class="content">
        <div class="left-section">
          <h2>SENDER</h2>
          <b>${data.sender_name}</b>
          <p>${data.sender_address}</p>
          <p>Date: ${subStringDate(data.created_at)}</p>
        </div>
        <div class="right-section">
          <h2>PROCESS</h2>
          <b>${data.shipping.name}</b>
          <p>${data.shipping.address}</p>
          <p>ID: ${data.shipping.id}</p>
        </div>
      </div>

      <div class="barcode-section">
        <img src="${qr.barcode}" style="width:250px;height:90px;" />
      </div>
    </div>
  </body>
</html>`;
  }
}
