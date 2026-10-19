import PDFDocument from "pdfkit";
import type { PaymentService } from "./payment.service";

type Invoice = Awaited<ReturnType<typeof PaymentService.getPaymentInvoice>>;
const doctorName = (name: string) => /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
const amountText = (invoice: Invoice) => `${invoice.currency} ${invoice.amount.toFixed(2)}`;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);
const palette = { navy: "#102a43", teal: "#087f8c", muted: "#62788a", line: "#dce7ed", pale: "#f3f8fa", green: "#187552" };

// Buffer the complete document before sending headers. The medical mark is
// vector artwork, and all receipt fields remain selectable text.
export const renderInvoicePdf = (invoice: Invoice): Promise<Buffer> => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 42, size: "A4", info: { Title: invoice.invoiceNumber, Author: "Doctorly Healthcare" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
        const left = 42;
        const width = doc.page.width - 84;
        const right = left + width;
        const text = (value: string, x: number, y: number, size = 10, options: PDFKit.Mixins.TextOptions = {}, color = palette.navy, bold = false) => {
            doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color).text(value, x, y, { width: right - x, lineGap: 3, ...options });
        };
        const label = (value: string, x: number, y: number, fieldWidth = width) => text(value, x, y, 7.5, { width: fieldWidth, characterSpacing: 1 }, palette.muted, true);
        const rule = (y: number) => doc.moveTo(left, y).lineTo(right, y).strokeColor(palette.line).lineWidth(0.7).stroke();
        doc.rect(0, 0, doc.page.width, 5).fill(palette.teal);
        doc.roundedRect(left, 40, 38, 38, 10).fill(palette.navy);
        doc.moveTo(49, 59).lineTo(56, 59).lineTo(60, 49).lineTo(65, 69).lineTo(70, 57).lineTo(74, 59)
            .lineWidth(1.8).strokeColor("#ffffff").lineJoin("round").stroke();
        text("Doctorly", 92, 42, 23, {}, palette.navy, true);
        text("HEALTHCARE", 93, 69, 7.5, { characterSpacing: 2 }, palette.teal, true);
        label("PATIENT BILLING", right - 150, 47, 150);
        text("Consultation payment receipt", right - 168, 63, 8.5, { width: 168, align: "right" }, palette.muted);
        rule(101);
        label("CARE, CLEARLY DOCUMENTED", left, 122);
        text("Consultation invoice", left, 141, 25, { width: width - 100 }, palette.navy, true);
        doc.roundedRect(right - 68, 143, 68, 24, 12).fill("#e8f5ee");
        text(invoice.paymentStatus, right - 68, 151, 8.5, { width: 68, align: "center", lineGap: 0 }, palette.green, true);
        doc.roundedRect(left, 190, width, 60, 7).fill(palette.pale);
        label("INVOICE NUMBER", left + 14, 203, 326);
        text(invoice.invoiceNumber, left + 14, 220, 7.8, { width: 326 });
        label("PAYMENT DATE", right - 148, 203, 134);
        text(invoice.paymentDate, right - 148, 220, 9.5, { width: 134 });

        const gap = 16;
        const cardWidth = (width - gap) / 2;
        const cardTop = 271;
        const providerX = left + cardWidth + gap;
        doc.font("Helvetica").fontSize(9);
        const hospitalHeight = doc.heightOfString(invoice.doctor.hospital, { width: cardWidth - 30, lineGap: 3 });
        const emailHeight = doc.heightOfString(invoice.patient.email, { width: cardWidth - 30, lineGap: 3 });
        const designationHeight = doc.heightOfString(invoice.doctor.designation, { width: cardWidth - 30, lineGap: 3 });
        doc.font("Helvetica-Bold").fontSize(11);
        const nameHeight = Math.max(doc.heightOfString(invoice.patient.name, { width: cardWidth - 30 }), doc.heightOfString(doctorName(invoice.doctor.name), { width: cardWidth - 30 }));
        const cardHeight = Math.max(112, 57 + nameHeight + Math.max(emailHeight, designationHeight + hospitalHeight + 6));
        for (const x of [left, providerX]) doc.roundedRect(x, cardTop, cardWidth, cardHeight, 7).lineWidth(0.7).strokeColor(palette.line).stroke();
        label("BILLED TO / PATIENT", left + 15, cardTop + 16, cardWidth - 30);
        label("CONSULTATION PROVIDER", providerX + 15, cardTop + 16, cardWidth - 30);
        text(invoice.patient.name, left + 15, cardTop + 38, 11, { width: cardWidth - 30 }, palette.navy, true);
        text(doctorName(invoice.doctor.name), providerX + 15, cardTop + 38, 11, { width: cardWidth - 30 }, palette.navy, true);
        const detailY = cardTop + 42 + nameHeight;
        text(invoice.patient.email, left + 15, detailY, 9, { width: cardWidth - 30 }, palette.muted);
        text(invoice.doctor.designation, providerX + 15, detailY, 9, { width: cardWidth - 30 }, palette.teal);
        text(invoice.doctor.hospital, providerX + 15, detailY + designationHeight + 6, 9, { width: cardWidth - 30 }, palette.muted);

        const tableTop = cardTop + cardHeight + 25;
        doc.roundedRect(left, tableTop, width, 29, 5).fill(palette.navy);
        text("CONSULTATION DETAILS", left + 12, tableTop + 10, 7.5, { width: 245, characterSpacing: 0.7 }, "#ffffff", true);
        text("QTY", left + 267, tableTop + 10, 7.5, { width: 30, align: "center" }, "#ffffff", true);
        text("UNIT PRICE", left + 306, tableTop + 10, 7.5, { width: 88, align: "right" }, "#ffffff", true);
        text("AMOUNT", right - 105, tableTop + 10, 7.5, { width: 93, align: "right" }, "#ffffff", true);
        const rowTop = tableTop + 45;
        text("Online medical consultation", left + 12, rowTop, 10.5, { width: 245 }, palette.navy, true);
        doc.font("Helvetica").fontSize(8.5);
        const scheduleHeight = doc.heightOfString(invoice.schedule.appointmentTime, { width: 237, lineGap: 3 });
        text(invoice.schedule.appointmentTime, left + 12, rowTop + 22, 8.5, { width: 237 }, palette.muted);
        text("1", left + 267, rowTop, 10, { width: 30, align: "center" });
        text(invoice.amount.toFixed(2), left + 306, rowTop, 10, { width: 88, align: "right" });
        text(invoice.amount.toFixed(2), right - 105, rowTop, 10, { width: 93, align: "right" }, palette.navy, true);
        const tableBottom = rowTop + 24 + scheduleHeight + 14;
        rule(tableBottom);
        text(`Appointment reference: ${invoice.appointmentId}`, left + 12, tableBottom + 11, 7.5, { width: width - 24 }, palette.muted);

        const summaryTop = tableBottom + 48;
        label("PAYMENT RECEIVED", left, summaryTop + 8, 235);
        text("Thank you for choosing Doctorly.", left, summaryTop + 26, 11, { width: 245 }, palette.navy, true);
        text("Keep this receipt with your healthcare records.", left, summaryTop + 46, 9, { width: 235 }, palette.muted);
        const totalX = right - 222;
        text("Subtotal", totalX + 14, summaryTop, 9, { width: 95 }, palette.muted);
        text(amountText(invoice), totalX + 95, summaryTop, 10, { width: 113, align: "right" });
        doc.roundedRect(totalX, summaryTop + 24, 222, 66, 7).fill(palette.navy);
        text("TOTAL PAID", totalX + 15, summaryTop + 36, 8, { width: 192, characterSpacing: 1 }, "#b9d7e4", true);
        text(amountText(invoice), totalX + 15, summaryTop + 55, 21, { width: 192, lineGap: 0 }, "#ffffff", true);
        const transactionTop = summaryTop + 113;
        doc.roundedRect(left, transactionTop, width, 58, 7).fill(palette.pale);
        label("TRANSACTION REFERENCE", left + 14, transactionTop + 13, width - 130);
        text(invoice.transactionId, left + 14, transactionTop + 31, 8.5, { width: width - 130 });
        label("CURRENCY", right - 90, transactionTop + 13, 76);
        text(invoice.currency, right - 90, transactionTop + 31, 9, { width: 76 }, palette.navy, true);
        const footerY = Math.max(transactionTop + 89, 762);
        const needsPage = footerY + 25 > doc.page.height - 30;
        if (needsPage) doc.addPage();
        const actualFooterY = needsPage ? 60 : footerY;
        rule(actualFooterY);
        text("Doctorly Healthcare  |  Consultation payment receipt", left, actualFooterY + 12, 7.3, { width: 320 }, palette.muted);
        text("Computer-generated receipt", right - 160, actualFooterY + 12, 7.3, { width: 160, align: "right" }, palette.muted);
        doc.end();
    } catch (error) {
        doc.destroy();
        reject(error);
    }
});

export const renderInvoiceHtml = (invoice: Invoice) => {
    const text = (value: string) => escapeHtml(value);
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Invoice ${text(invoice.invoiceNumber)}</title>
<style>*{box-sizing:border-box}body{margin:0;padding:36px 18px;background:#eaf0f4;color:#102a43;font:14px/1.6 Arial,sans-serif}.sheet{max-width:880px;margin:auto;background:white;border-top:6px solid #087f8c;padding:42px;box-shadow:0 16px 60px #102a4310}.brand-row{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dce7ed;padding-bottom:26px}.brand{display:flex;gap:14px;align-items:center}.mark{width:48px;height:48px;border-radius:12px;background:#102a43;display:grid;place-items:center;color:white}.wordmark{font-size:29px;line-height:1.1;font-weight:700;letter-spacing:-1px}.healthcare{font-size:10px;letter-spacing:2.6px;color:#087f8c;margin-top:5px}.eyebrow{font-size:10px;font-weight:700;letter-spacing:1.6px;color:#62788a;text-transform:uppercase}.billing{text-align:right;color:#62788a;font-size:12px}.title-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:28px 0 24px}h1{font-size:32px;line-height:1.25;letter-spacing:-1px;margin:8px 0 0}.paid{background:#e8f5ee;color:#187552;padding:6px 16px;border-radius:30px;font-size:11px;font-weight:700;letter-spacing:1px}.meta,.transaction{background:#f3f8fa;border-radius:8px;padding:17px 20px;display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:16px}.value{margin-top:7px;overflow-wrap:anywhere}.reference{font:11px/1.7 monospace;overflow-wrap:anywhere}.parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:25px 0 28px}.party{border:1px solid #dce7ed;border-radius:8px;padding:20px}.name{font-size:16px;font-weight:700;margin:12px 0 4px}.detail{font-size:12px;color:#62788a;overflow-wrap:anywhere}.designation{color:#087f8c}table{width:100%;border-collapse:collapse;font-size:12px}thead{background:#102a43;color:white}th{text-transform:uppercase;letter-spacing:1px;font-size:9px;text-align:left;padding:13px 12px}td{padding:20px 12px;border-bottom:1px solid #dce7ed;vertical-align:top}.number{text-align:right;white-space:nowrap}.schedule{max-width:300px;margin-top:8px;color:#62788a;font-size:11px}.appointment{font-size:10px;color:#62788a;padding:12px;overflow-wrap:anywhere}.summary{display:grid;grid-template-columns:1fr 280px;gap:28px;margin:24px 0 28px}.thanks{font-weight:700;margin-top:10px}.subtotal{display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:0 16px 12px}.total{background:#102a43;color:white;padding:16px 20px;border-radius:8px}.total .eyebrow{color:#b9d7e4}.amount{font-size:28px;font-weight:700;margin-top:5px;letter-spacing:-.6px}.transaction{grid-template-columns:minmax(0,1fr) 100px}footer{margin-top:48px;padding-top:16px;border-top:1px solid #dce7ed;display:flex;justify-content:space-between;gap:16px;font-size:10px;color:#62788a}@media(max-width:600px){body{padding:0}.sheet{padding:24px}.billing{display:none}h1{font-size:26px}.parties,.meta,.summary{grid-template-columns:1fr}.transaction{grid-template-columns:minmax(0,1fr) 70px}.amount{font-size:25px}th,td{padding:12px 6px}.number{white-space:normal}footer{flex-direction:column}}@page{size:A4;margin:12mm}@media print{body{background:white;padding:0}.sheet{border:0;padding:0;box-shadow:none;max-width:none}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}.parties,.summary,.transaction,footer{break-inside:avoid}}</style></head><body><main class="sheet">
<header class="brand-row"><div class="brand"><div class="mark"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 16h6l4-9 5 18 4-12 3 3h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div><div class="wordmark">Doctorly</div><div class="healthcare">HEALTHCARE</div></div></div><div class="billing"><div class="eyebrow">Patient billing</div>Consultation payment receipt</div></header>
<div class="title-row"><div><div class="eyebrow">Care, clearly documented</div><h1>Consultation invoice</h1></div><span class="paid">${text(invoice.paymentStatus)}</span></div>
<div class="meta"><div><div class="eyebrow">Invoice number</div><div class="value reference">${text(invoice.invoiceNumber)}</div></div><div><div class="eyebrow">Payment date</div><div class="value">${text(invoice.paymentDate)}</div></div></div>
<div class="parties"><section class="party"><div class="eyebrow">Billed to / patient</div><div class="name">${text(invoice.patient.name)}</div><div class="detail">${text(invoice.patient.email)}</div></section><section class="party"><div class="eyebrow">Consultation provider</div><div class="name">${text(doctorName(invoice.doctor.name))}</div><div class="detail designation">${text(invoice.doctor.designation)}</div><div class="detail">${text(invoice.doctor.hospital)}</div></section></div>
<table><thead><tr><th>Consultation details</th><th class="number">Qty</th><th class="number">Unit price</th><th class="number">Amount</th></tr></thead><tbody><tr><td><strong>Online medical consultation</strong><div class="schedule">${text(invoice.schedule.appointmentTime)}</div></td><td class="number">1</td><td class="number">${invoice.amount.toFixed(2)}</td><td class="number"><strong>${invoice.amount.toFixed(2)}</strong></td></tr></tbody></table><div class="appointment">Appointment reference: ${text(invoice.appointmentId)}</div>
<div class="summary"><div><div class="eyebrow">Payment received</div><div class="thanks">Thank you for choosing Doctorly.</div><div class="detail">Keep this receipt with your healthcare records.</div></div><div><div class="subtotal"><span>Subtotal</span><strong>${text(amountText(invoice))}</strong></div><div class="total"><div class="eyebrow">Total paid</div><div class="amount">${text(amountText(invoice))}</div></div></div></div>
<div class="transaction"><div><div class="eyebrow">Transaction reference</div><div class="value reference">${text(invoice.transactionId)}</div></div><div><div class="eyebrow">Currency</div><div class="value"><strong>${text(invoice.currency)}</strong></div></div></div><footer><span>Doctorly Healthcare | Consultation payment receipt</span><span>Computer-generated receipt</span></footer></main></body></html>`;
};
