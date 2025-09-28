import PDFDocument from 'pdfkit';

const generateInvoicePDFBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    // Header
    doc.fontSize(16).text(invoice.header || 'PG & Room Rental Invoice', { align: 'center' });
    doc.moveDown();
    // Invoice details
    doc.fontSize(12).text(`Invoice ID: ${invoice.invoiceId}`);
    doc.text(`Booking ID: ${invoice.bookingId}`);
    doc.text(`User: ${invoice.user.name} (${invoice.user.email})`);
    doc.text(`Item: ${invoice.itemType} - ${invoice.itemName}`);
    if (invoice.itemAddress) doc.text(`Address: ${invoice.itemAddress}`);
    doc.text(`Start Date: ${invoice.startDate ? new Date(invoice.startDate).toLocaleDateString() : '-'}`);
    doc.text(`End Date: ${invoice.endDate ? new Date(invoice.endDate).toLocaleDateString() : '-'}`);
    doc.text(`Amount: ₹${invoice.amount}`);
    doc.text(`GST: ₹${invoice.gst}`);
    doc.text(`Payment Status: ${invoice.paymentStatus}`);
    doc.moveDown();
    if (invoice.details) doc.text(`Details: ${JSON.stringify(invoice.details)}`);
    doc.moveDown();
    doc.fontSize(10).text(invoice.footer || 'Thank you for using PG & Room Rental System', { align: 'center' });
    doc.end();
  });
};

export { generateInvoicePDFBuffer };
