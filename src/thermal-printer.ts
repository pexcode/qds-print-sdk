import qz from "qz-tray";

/**
 * Error thrown when QZ Tray is not reachable or not running.
 */
export class QZTrayNotRunningError extends Error {
  constructor(message = "QZ Tray is not running or cannot be reached") {
    super(message);
    this.name = "QZTrayNotRunningError";
  }
}

/**
 * Minimal shape of the printer configuration object used by qz-tray.
 */
export type QZPrinterConfig = ReturnType<typeof qz.configs.create>;

/**
 * Data required to print a basic shipping label on a thermal printer.
 * This is intentionally simple and independent from the HTML-based label layout.
 */
export interface ThermalShippingLabel {
  id: string;
  recipientName: string;
  recipientAddress: string;
  senderName: string;
  senderAddress?: string;
  shippingName: string;
  shippingAddress: string;
  shippingId: string;
  /**
   * Optional data to encode into an ESC/POS QR code (e.g. shipment ID or URL).
   * If omitted, the printer may fall back to using `id`.
   */
  qrData?: string;
  /**
   * Optional logical printer width in characters for layout (e.g. 32 for 58mm, 48 for 80mm).
   */
  lineWidth?: number;
  /**
   * Optional QR module size used by ESC/POS (typically 3–8).
   */
  qrModuleSize?: number;
  /**
   * Optional pre-formatted creation datetime string to print on the label.
   */
  createdAtText?: string;
}

/**
 * High-level interface for a thermal printer bound to a specific device.
 */
export interface ThermalPrinter {
  /**
   * Low-level ESC/POS printing.
   * Accepts an array of raw command strings which will be sent as-is to the printer.
   */
  sendEscPos(commands: string[]): Promise<void>;

  /**
   * Convenience helper for printing a simple shipping label
   * using ESC/POS text commands.
   */
  printShippingLabel(label: ThermalShippingLabel): Promise<void>;
}

/**
 * Internal implementation of a thermal printer bound to a specific device name.
 */
class QZThermalPrinter implements ThermalPrinter {
  private readonly printerName: string;

  constructor(printerName: string) {
    this.printerName = printerName;
  }

  private createConfig(): QZPrinterConfig {
    return qz.configs.create(this.printerName, {
      // ESC/POS thermal printers typically expect text.
      altPrinting: true,
      encoding: "UTF-8",
    });
  }

  /**
   * Sends raw ESC/POS commands to the printer using QZ Tray.
   */
  async sendEscPos(commands: string[]): Promise<void> {
    const config = this.createConfig();

    try {
      await qz.print(config, commands);
    } catch (error) {
      if (this.isQZNotRunningError(error)) {
        throw new QZTrayNotRunningError();
      }
      throw error;
    }
  }

  /**
   * Prints a basic shipping label using ESC/POS text commands.
   * This focuses on:
   * - Initializing the printer
   * - Adding line breaks
   * - Cutting the paper at the end
   */
  async printShippingLabel(label: ThermalShippingLabel): Promise<void> {
    const lineWidth = label.lineWidth ?? 29;
    const commands: string[] = [
      this.escInit(),
      this.escAlignCenter(),
      "QuickDeliverySystem\n",
      `${"-".repeat(lineWidth)}\n`,
      this.escAlignLeft(),
      "SHIP TO\n",
      `${label.recipientName}\n`,
      `${label.recipientAddress}\n`,
      "\n",
      "SENDER\n",
      `${label.senderName}\n`,
      label.senderAddress ? `${label.senderAddress}\n` : "",
      "\n",
      "PROCESS\n",
      `${label.shippingName}\n`,
      `${label.shippingAddress}\n`,
      `ID: ${label.shippingId}\n`,
      "\n",
      label.createdAtText ? `DATE: ${label.createdAtText}\n\n` : "",
      `TRACK ID: ${label.id}\n`,
    ];

    const qrContent = label.qrData ?? label.id;
    if (qrContent) {
      commands.push(...this.escPosQr(qrContent, label.qrModuleSize));
    }

    commands.push("\n\n", this.escCutFull());

    const filtered = commands.filter((cmd) => cmd.length > 0);
    await this.sendEscPos(filtered);
  }

  /**
   * ESC/POS: Initialize printer.
   */
  private escInit(): string {
    return "\x1B\x40";
  }

  /**
   * ESC/POS: Align center.
   */
  private escAlignCenter(): string {
    return "\x1B\x61\x01";
  }

  /**
   * ESC/POS: Align left.
   */
  private escAlignLeft(): string {
    return "\x1B\x61\x00";
  }

  /**
   * ESC/POS: Full cut.
   */
  private escCutFull(): string {
    return "\x1D\x56\x00";
  }

  /**
   * Builds ESC/POS commands for printing a QR code (model 2) with the given data.
   * Based on the standard GS ( k QR sequence used by many ESC/POS thermal printers.
   */
  private escPosQr(data: string, moduleSize?: number): string[] {
    const size = moduleSize ?? 6;
    const storeLen = data.length + 3;
    const pL = String.fromCharCode(storeLen & 0xff);
    const pH = String.fromCharCode((storeLen >> 8) & 0xff);

    return [
      // Select model: 2
      "\x1D\x28\x6B\x04\x00\x31\x41\x32\x00",
      // Set module size (pixel size of each module)
      `\x1D\x28\x6B\x03\x00\x31\x43${String.fromCharCode(size)}`,
      // Set error correction level: 49 -> '1' (M)
      "\x1D\x28\x6B\x03\x00\x31\x45\x31",
      // Store data in the symbol
      `\x1D\x28\x6B${pL}${pH}\x31\x50\x30${data}`,
      // Print the symbol
      "\x1D\x28\x6B\x03\x00\x31\x51\x30",
    ];
  }

  private isQZNotRunningError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
    return (
      message.includes("Unable to establish connection with QZ") ||
      message.includes("Unable to connect to QZ") ||
      message.includes("QZ Tray is not running")
    );
  }
}

/**
 * Connects to QZ Tray (if not already connected), finds the requested printer by name,
 * and returns a high-level `ThermalPrinter` instance bound to that printer.
 *
 * Throws:
 * - `QZTrayNotRunningError` if QZ Tray is not reachable.
 * - `Error` if the requested printer cannot be found.
 */
export async function connectPrinter(printerName: string): Promise<ThermalPrinter> {
  if (!printerName) {
    throw new Error("Printer name is required");
  }

  if (!qz.websocket.isActive()) {
    try {
      await qz.websocket.connect();
    } catch {
      throw new QZTrayNotRunningError();
    }
  }

  try {
    // qz.printers.find resolves with the matched printer name or rejects if not found.
    await qz.printers.find(printerName);
  } catch {
    throw new Error(`Printer "${printerName}" was not found by QZ Tray`);
  }

  return new QZThermalPrinter(printerName);
}

