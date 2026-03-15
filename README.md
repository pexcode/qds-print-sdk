# QDS Print SDK

**pexcode.com** · **quickdeliverysystem.com**

TypeScript SDK for printing Quick Delivery System shipping labels to thermal printers using **QZ Tray** and **ESC/POS** commands. Labels include recipient/sender/shipping details, a scannable QR code, and formatted date.

---

## Install

```bash
npm i @pexcode/qds-print-sdk
```

or

```bash
npm i --save @pexcode/qds-print-sdk
```

---

## Requirements

- **QZ Tray** must be installed and running on the machine (download from [qz.io](https://qz.io)).
- A thermal printer (58mm or 80mm) configured and available to QZ Tray.

---

## Usage

### Basic

```ts
import QDSPrint, { type PrintData } from "@pexcode/qds-print-sdk";

// printerName: exact or partial name as shown in QZ Tray
// printerSize: "58mm" or "80mm" (default: "80mm")
const printer = new QDSPrint("My Thermal Printer", "80mm");

const data: PrintData = {
  id: "123456",
  uuid: "abcd-efgh-ijkl",
  dest_name: "John Doe",
  dest_address: "123 Main St, Paris",
  sender_name: "Jane Smith",
  sender_address: "45 Rue de Lyon, Paris",
  created_at: new Date().toISOString(),
  shipping: {
    name: "QDS Warehouse",
    address: "456 Route de Lille, France",
    id: "WH-001",
  },
};

// Single label
await printer.print(data);

// Multiple labels (printed in sequence)
await printer.printBulk([data, data2, data3]);
```

### Printer size

- **`"80mm"`** (default): wider line, larger QR code.
- **`"58mm"`**: narrower line, smaller QR for narrow rolls.

```ts
const printer58 = new QDSPrint("My 58mm Printer", "58mm");
const printer80 = new QDSPrint("My 80mm Printer"); // 80mm by default
```

### Error handling (QZ Tray not running)

```ts
import QDSPrint, { QZTrayNotRunningError } from "@pexcode/qds-print-sdk";

const printer = new QDSPrint("My Printer", "80mm");

try {
  await printer.print(data);
} catch (err) {
  if (err instanceof QZTrayNotRunningError) {
    console.error("Start QZ Tray and try again.");
  } else {
    throw err;
  }
}
```

## Types

| Type | Description |
|------|-------------|
| `PrintData` | Full label payload: id, uuid, dest_*, sender_*, created_at, shipping |
| `ShippingInfo` | shipping.name, shipping.address, shipping.id |
| `PrinterSize` | `"58mm" \| "80mm"` |

---

## Note

This package provides the **Quick Delivery System** label format and is not intended to be customized. If you need the same layout for your own system, you can still use the SDK as-is.
