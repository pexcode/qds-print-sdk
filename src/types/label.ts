/** Normalized label data used by all print layouts. */
export interface ShippingLabel {
  id: string;
  uuid?: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity?: string;
  senderName: string;
  senderAddress?: string;
  shippingName: string;
  shippingAddress: string;
  shippingId: string;
  qrData?: string;
  createdAtText?: string;
  companyLogoUrl?: string;
}
