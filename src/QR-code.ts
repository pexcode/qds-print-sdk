import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

/**
 * Utility class for generating QR codes and barcodes
 */
export default class QRcode {
  /**
   * Builds a QR code from a given text and returns it as a Data URL (base64 PNG)
   * @param text - The text to encode into the QR code
   * @returns Promise<string> - The generated QR code image as a Data URL
   */
  async qrBuild(text: string): Promise<string> {
    try {
      const url = await QRCode.toDataURL(text);
      return url;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  /**
   * Builds a barcode (CODE39 format) and returns it as a Data URL (base64 PNG)
   * @param text - The text to encode into the barcode
   * @returns string - The generated barcode image as a Data URL
   */
  barBuild(text: string): string {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, { format: "CODE39" });
    return canvas.toDataURL("image/png");
  }
}
