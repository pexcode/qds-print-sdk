/**
 * Generates a CODE128 barcode as a PNG data URL (browser only).
 */
export async function generateBarcodeDataUrl(value: string): Promise<string> {
  if (!value || typeof document === "undefined") return "";

  const { default: JsBarcode } = await import("jsbarcode");
  const canvas = document.createElement("canvas");

  JsBarcode(canvas, value, {
    format: "CODE128",
    width: 2,
    height: 52,
    displayValue: true,
    fontSize: 14,
    margin: 4,
  });

  return canvas.toDataURL("image/png");
}
