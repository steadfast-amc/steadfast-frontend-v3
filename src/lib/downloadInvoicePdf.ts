import { api } from "./api";

// A plain <a href="/api/invoices/:id/pdf"> wouldn't carry the JWT
// Authorization header the backend requires, so this fetches the PDF as a
// blob through the authenticated axios instance and triggers a save via a
// temporary object URL instead.
export async function downloadInvoicePdf(invoiceId: string, filename: string): Promise<void> {
  const response = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
