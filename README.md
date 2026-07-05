# QDS Print SDK

**pexcode.com** · **quickdeliverysystem.com**

TypeScript SDK for printing Quick Delivery System shipping labels via **browser print dialog** or a **local print service** (silent print).

Supported formats:
- **A4** — full-page shipping document
- **LABEL_100x150** — 100×150 mm thermal label (RTL Arabic, barcode + QR)

---

## Install

```bash
npm i @pexcode/qds-print-sdk
```

---

## Requirements

**Browser print (default)** — runs in the browser. `window.print()` opens the system dialog.

**Print service (silent print)** — local HTTP service (default `http://localhost:4510`):
- `GET /printers` — list installed printers
- `POST /print` — send HTML, PDF, or image jobs

---

## Usage

### Print service (silent)

```ts
import QDSPrint, { type PrintData } from "@pexcode/qds-print-sdk";
import { getPrinters } from "@pexcode/qds-print-sdk/print-service";

const printers = await getPrinters("http://localhost:4510");

const printer = new QDSPrint("Zebra ZD421", {
  paperType: "LABEL_100x150",
  printService: {
    baseUrl: "http://localhost:4510",
    printer: "Zebra ZD421",
  },
});

await printer.print(data);
```

### Browser dialog

```ts
import QDSPrint, { type PrintData } from "@pexcode/qds-print-sdk";

const printer = new QDSPrint(); // A4 by default
await printer.print(data);

// 100×150 label
const label = new QDSPrint("", "LABEL_100x150");
await label.print(data);
```

### Paper types

| `paperType` | Description |
|-------------|-------------|
| `"A4"` (default) | Full A4 page |
| `"LABEL_100x150"` | 100×150 mm shipping label (RTL, barcode + QR) |

### PrintData

```ts
const data: PrintData = {
  id: "123456",
  uuid: "abcd-efgh",
  recipientName: "John Doe",
  recipientAddress: "123 Main St",
  recipientCity: "Riyadh",       // optional — LABEL_100x150
  senderName: "Jane Smith",
  senderAddress: "45 Rue de Lyon",
  createdAt: new Date().toISOString(),
  shippingInfo: {
    name: "QDS Warehouse",
    address: "456 Route de Lille",
    id: "WH-001",
  },
  companyLogoUrl: "https://...", // optional
};
```

### Low-level print service API

```ts
import { getPrinters, printJob } from "@pexcode/qds-print-sdk/print-service";

await printJob("http://localhost:4510", {
  printer: "Zebra ZD421",
  paper: "100x150",
  contentType: "html",
  content: htmlString,
});
```

See `examples/print-service-integration.ts` for Vue composable examples.

### Error handling

```ts
import QDSPrint, { BrowserPrintNotAvailableError, PrintServiceError } from "@pexcode/qds-print-sdk";

try {
  await new QDSPrint().print(data);
} catch (err) {
  if (err instanceof BrowserPrintNotAvailableError) {
    console.error("Printing only works in a browser.");
  }
  if (err instanceof PrintServiceError) {
    console.error("Print service error:", err.message);
  }
}
```

## Types

| Type | Description |
|------|-------------|
| `PrintData` | Label payload |
| `PaperType` | `"A4" \| "LABEL_100x150"` |
| `ShippingLabel` | Normalized label used by layouts |
| `PrintServiceConfig` | `{ baseUrl, printer?, copies? }` |
