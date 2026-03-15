declare module "qz-tray" {
  export interface QZWebsocket {
    isActive(): boolean;
    connect(config?: unknown): Promise<void>;
  }

  export interface QZPrinters {
    /**
     * Finds a printer by name or partial name.
     * Resolves with the matched printer name or rejects if not found.
     */
    find(printerName: string): Promise<string>;
  }

  export interface QZConfigs {
    /**
     * Creates a printer configuration object used when calling qz.print.
     */
    create(
      printer: string,
      options?: {
        altPrinting?: boolean;
        encoding?: string;
        [key: string]: unknown;
      },
    ): unknown;
  }

  export type QZPrintData = (string | number | Uint8Array | ArrayBuffer)[];

  export interface QZ {
    websocket: QZWebsocket;
    printers: QZPrinters;
    configs: QZConfigs;
    print(config: unknown, data: QZPrintData): Promise<void>;
  }

  const qz: QZ;
  export default qz;
}

