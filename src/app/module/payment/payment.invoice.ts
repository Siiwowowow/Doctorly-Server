import PDFDocument from "pdfkit";
import type { PaymentService } from "./payment.service";

type Invoice = Awaited<ReturnType<typeof PaymentService.getPaymentInvoice>>;

const doctorName = (name: string) => /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
const amountText = (invoice: Invoice) => `${invoice.currency} ${invoice.amount.toFixed(2)}`;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);

// Finish generating the PDF before sending headers, so rendering errors return
// a normal error response rather than a partially downloaded, corrupt PDF.
export const renderInvoicePdf = (invoice: Invoice): Promise<Buffer> => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4", info: { Title: invoice.invoiceNumber, Author: "Doctorly Healthcare" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
        const width = doc.page.width - 100;
        doc.fillColor("#0284c7").font("Helvetica-Bold").fontSize(24).text("Doctorly Healthcare");
        doc.fillColor("#475569").font("Helvetica").fontSize(11).text("Official consultation payment receipt").moveDown();
        doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(17).text("INVOICE");
        doc.font("Helvetica").fontSize(10).text(invoice.invoiceNumber, { width }).text(`Payment date: ${invoice.paymentDate}`).text(`Status: ${invoice.paymentStatus}`).moveDown();

        const section = (label: string, lines: string[]) => {
            doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(label);
            doc.font("Helvetica").fontSize(10).fillColor("#334155");
            for (const line of lines) doc.text(line, { width });
            doc.moveDown();
        };
        section("BILLED TO", [invoice.patient.name, invoice.patient.email]);
        section("CONSULTATION PROVIDER", [doctorName(invoice.doctor.name), invoice.doctor.designation, invoice.doctor.hospital]);
        section("ONLINE MEDICAL CONSULTATION", [invoice.schedule.appointmentTime, `Appointment: ${invoice.appointmentId}`]);
        section("PAYMENT DETAILS", [`Subtotal: ${amountText(invoice)}`, `Currency: ${invoice.currency}`, `Transaction reference: ${invoice.transactionId}`]);
        doc.font("Helvetica-Bold").fontSize(16).fillColor("#0284c7").text(`Total paid: ${amountText(invoice)}`).moveDown();
        doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("This is a computer-generated receipt. Thank you for choosing Doctorly Healthcare.", { width });
        doc.end();
    } catch (error) {
        doc.destroy();
        reject(error);
    }
});

export const renderInvoiceHtml = (invoice: Invoice) => {
    const text = (value: string) => escapeHtml(value);
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Invoice ${text(invoice.invoiceNumber)}</title>
<style>body{font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;margin:0;padding:24px;line-height:1.6}main{max-width:760px;margin:auto;padding:32px;background:white;border:1px solid #e2e8f0;border-radius:12px}header{border-bottom:2px solid #0284c7;padding-bottom:20px}h1{color:#0284c7;margin:0}h2{font-size:16px;margin-bottom:8px}p{margin:4px 0;overflow-wrap:anywhere}section{margin:24px 0}.total{font-size:22px;font-weight:bold;color:#0284c7}footer{border-top:1px solid #e2e8f0;padding-top:16px;color:#64748b;font-size:12px}@media print{body{padding:0;background:white}main{border:0;padding:0}}</style></head><body><main>
<header><h1>Doctorly Healthcare</h1><p>Official consultation payment receipt</p><h2>Invoice ${text(invoice.invoiceNumber)}</h2><p>Payment date: ${text(invoice.paymentDate)}</p><p>Status: ${text(invoice.paymentStatus)}</p></header>
<section><h2>Billed to</h2><p>${text(invoice.patient.name)}</p><p>${text(invoice.patient.email)}</p></section>
<section><h2>Consultation provider</h2><p>${text(doctorName(invoice.doctor.name))}</p><p>${text(invoice.doctor.designation)}</p><p>${text(invoice.doctor.hospital)}</p></section>
<section><h2>Online medical consultation</h2><p>${text(invoice.schedule.appointmentTime)}</p><p>Appointment: ${text(invoice.appointmentId)}</p></section>
<section><p>Subtotal: ${text(amountText(invoice))}</p><p class="total">Total paid: ${text(amountText(invoice))}</p><p>Currency: ${text(invoice.currency)}</p><p>Transaction reference: ${text(invoice.transactionId)}</p></section>
<footer>This is a computer-generated receipt. Thank you for choosing Doctorly Healthcare.</footer>
</main></body></html>`;
};
