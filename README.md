## pexcode.com

## quickdeliverysystem.com

## QDS-print-sdk

### install (npm)

--Note this packge for Quick delivery system , custom print format that cannot be modified or customized. However, if you are interested, you can benefit from this package.
```bash

npm i @pexcode/qds-print-sdk

```
or 

```bash

npm i --save @pexcode/qds-print-sdk

```
## Description

This is a library published under an pexcode to help users and developers to use quickdeliverysystem printing.

## Usage

## You need to prepare the package, print the information, and attach it securely to the package.

```bash
### useing and declare

## add the iframe in your html template or in first page in your project 
<iframe id="printf" name="printf" style="display: none"></iframe>

### let data={the package data }

import QDSPrint from "@pexcode/qds-print-sdk";
const printer = new QDSPrint();

printer.print({
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
    id: "WH-001"
  }
});
 
```

 