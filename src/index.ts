import type { ThermalShippingLabel, ThermalPrinter } from "./thermal-printer";
import { connectPrinter } from "./thermal-printer";
export * from "./thermal-printer";

export type PrinterSize = "58mm" | "80mm";

/** Shipment and printing data types */
export type ShippingInfo = {
  name: string;
  address: string;
  id: string;
};

export type PrintData = {
  id: string;
  uuid: string;
  dest_name: string;
  dest_address: string;
  sender_name: string;
  sender_address?: string;
  created_at: string;
  shipping: ShippingInfo;
};

/**
 * QDSPrint SDK – handles generation and printing of delivery labels.
 */
export default class QDSPrint {
  private printerName: string;
  private printerSize: PrinterSize;

  constructor(printerName: string, printerSize: PrinterSize = "80mm") {
    this.printerName = printerName;
    this.printerSize = printerSize;
  }


  /**
   * Print a single label (public API).
   * Internally uses ESC/POS thermal printing via QZ Tray.
   */
  async print(data: PrintData): Promise<void> {
    await this.printThermal(data);
  }

  /**
   * Print multiple labels (public API).
   * Internally uses ESC/POS thermal printing via QZ Tray.
   */
  async printBulk(data: PrintData[]): Promise<void> {
    await this.printThermalBulk(data);
  }

  /**
   * Print a single label directly to a thermal printer using ESC/POS,
   * based on the current PrintData structure.
   */
  async printThermal(data: PrintData): Promise<void> {
    const printer = await connectPrinter(this.printerName);
    const label = this.toThermalLabel(data);
    await printer.printShippingLabel(label);
  }

  /**
   * Print multiple labels to a thermal printer in sequence using ESC/POS,
   * based on the current PrintData structure.
   */
  async printThermalBulk(data: PrintData[]): Promise<void> {
    if (!data.length) {
      console.warn("printThermalBulk called with empty data");
      return;
    }

    const printer: ThermalPrinter = await connectPrinter(this.printerName);

    for (const item of data) {
      const label = this.toThermalLabel(item);
      await printer.printShippingLabel(label);
    }
  }

  /**
   * Adapter from the existing PrintData structure to the ThermalShippingLabel
   * used by the ESC/POS thermal printer implementation.
   */
  private toThermalLabel(data: PrintData): ThermalShippingLabel {
    const is80 = this.printerSize === "80mm";
    const lineWidth = is80 ? 48 : 32;
    const qrModuleSize = is80 ? 6 : 4;

    return {
      id: data.id,
      recipientName: data.dest_name,
      recipientAddress: data.dest_address,
      senderName: data.sender_name,
      senderAddress: data.sender_address,
      shippingName: data.shipping.name,
      shippingAddress: data.shipping.address,
      shippingId: data.shipping.id,
      qrData: data.id,
      lineWidth,
      qrModuleSize,
      createdAtText: this.formatCreatedAt(data.created_at),
    };
  }

  private formatCreatedAt(value: string): string {
    return new Date(value).toLocaleString("fr", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
