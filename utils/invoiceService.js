import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
// Generate unique invoice number
const generateInvoiceNumber = async () => {
  const { default: Invoice } = await import('../models/Invoice.js');
  
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  // Find the last invoice for this month
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^INV-${year}${month}` }
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
};

// Calculate tax amount
const calculateTax = (amount, taxRate) => {
  // Get tax rate from environment variable or use 18% as fallback
  const defaultTaxRate = process.env.DEFAULT_TAX_RATE || 18;
  const rate = taxRate || defaultTaxRate;
  return (amount * rate) / 100;
};

// Calculate due date based on payment terms
const calculateDueDate = (issueDate, paymentTerms) => {
  // Get payment terms from environment variable or use 30 days as fallback
  const defaultPaymentTerms = process.env.DEFAULT_PAYMENT_TERMS || 30;
  const terms = paymentTerms || defaultPaymentTerms;
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + parseInt(terms));
  return dueDate;
};

// Format currency for display
const formatCurrency = (amount) => {
  const currency = process.env.DEFAULT_CURRENCY || 'INR';
  const locale = process.env.DEFAULT_LOCALE || 'en-IN';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date for display
const formatDate = (date) => {
  const locale = process.env.DEFAULT_LOCALE || 'en-IN';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

// Generate PDF invoice
const generatePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('INVOICE', 50, 50, { align: 'center' });
      doc.moveTo(50, 80).lineTo(550, 80).stroke();

      // PG/Owner Details (Left side)
      doc.fontSize(14).text('From:', 50, 100);
      doc.fontSize(12);
      if (invoice.pgId && invoice.pgId.name) {
        doc.text(invoice.pgId.name, 50, 120);
      }
      if (invoice.pgId && invoice.pgId.address) {
        doc.text(invoice.pgId.address, 50, 140);
      }
      if (invoice.ownerId && invoice.ownerId.name) {
        doc.text(`Owner: ${invoice.ownerId.name}`, 50, 160);
      }
      if (invoice.ownerId && invoice.ownerId.email) {
        doc.text(`Email: ${invoice.ownerId.email}`, 50, 180);
      }
      if (invoice.ownerId && invoice.ownerId.phone) {
        doc.text(`Phone: ${invoice.ownerId.phone}`, 50, 200);
      }

      // Invoice Details (Right side)
      doc.fontSize(14).text('Invoice Details:', 350, 100);
      doc.fontSize(12);
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, 350, 120);
      doc.text(`Date: ${formatDate(invoice.createdAt)}`, 350, 140);
      doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 350, 160);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 350, 180);

      // Tenant Details
      doc.fontSize(14).text('Bill To:', 50, 250);
      doc.fontSize(12);
      if (invoice.tenantId && invoice.tenantId.userId) {
        doc.text(invoice.tenantId.userId.name || 'N/A', 50, 270);
        doc.text(invoice.tenantId.userId.email || 'N/A', 50, 290);
        doc.text(invoice.tenantId.userId.phone || 'N/A', 50, 310);
      }

      // Room Details
      if (invoice.roomId) {
        doc.text(`Room: ${invoice.roomId.roomNumber || 'N/A'}`, 50, 330);
        doc.text(`Rent: ${formatCurrency(invoice.roomId.rent || 0)}`, 50, 350);
      }

      // Line separator
      doc.moveTo(50, 380).lineTo(550, 380).stroke();

      // Invoice Items Table Header
      doc.fontSize(12);
      doc.text('Description', 50, 400);
      doc.text('Qty', 300, 400);
      doc.text('Rate', 350, 400);
      doc.text('Amount', 450, 400);
      
      // Table header line
      doc.moveTo(50, 420).lineTo(550, 420).stroke();

      // Invoice Items
      let yPosition = 440;
      if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach((item) => {
          doc.text(item.description || 'N/A', 50, yPosition);
          doc.text((item.quantity || 1).toString(), 300, yPosition);
          doc.text(formatCurrency(item.rate || 0), 350, yPosition);
          doc.text(formatCurrency(item.amount || 0), 450, yPosition);
          yPosition += 20;
        });
      } else {
        doc.text(invoice.description || 'Monthly Rent', 50, yPosition);
        doc.text('1', 300, yPosition);
        doc.text(formatCurrency(invoice.amount), 350, yPosition);
        doc.text(formatCurrency(invoice.amount), 450, yPosition);
        yPosition += 20;
      }

      // Line separator
      yPosition += 10;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

      // Totals
      yPosition += 20;
      doc.text('Subtotal:', 350, yPosition);
      doc.text(formatCurrency(invoice.amount), 450, yPosition);

      if (invoice.taxAmount > 0) {
        yPosition += 20;
        doc.text('Tax:', 350, yPosition);
        doc.text(formatCurrency(invoice.taxAmount), 450, yPosition);
      }

      if (invoice.discountAmount > 0) {
        yPosition += 20;
        doc.text('Discount:', 350, yPosition);
        doc.text(`-${formatCurrency(invoice.discountAmount)}`, 450, yPosition);
      }

      // Total line
      yPosition += 10;
      doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 20;

      doc.fontSize(14);
      doc.text('Total:', 350, yPosition);
      doc.text(formatCurrency(invoice.totalAmount), 450, yPosition);

      // Payment Information
      if (invoice.status === 'paid' && invoice.paymentDate) {
        yPosition += 40;
        doc.fontSize(12);
        doc.text('Payment Information:', 50, yPosition);
        yPosition += 20;
        doc.text(`Payment Date: ${formatDate(invoice.paymentDate)}`, 50, yPosition);
        yPosition += 20;
        doc.text(`Payment Method: ${invoice.paymentMethod || 'N/A'}`, 50, yPosition);
        if (invoice.transactionId) {
          yPosition += 20;
          doc.text(`Transaction ID: ${invoice.transactionId}`, 50, yPosition);
        }
      }

      // Footer
      yPosition += 60;
      doc.fontSize(10);
      doc.text('Thank you for your business!', 50, yPosition, { align: 'center' });
      
      if (invoice.notes) {
        yPosition += 20;
        doc.text(`Notes: ${invoice.notes}`, 50, yPosition);
      }

      // Terms and conditions
      yPosition += 30;
      doc.text('Terms & Conditions:', 50, yPosition);
      yPosition += 15;
      doc.text('• Payment is due within 30 days of invoice date', 50, yPosition);
      yPosition += 15;
      doc.text('• Late payment may incur additional charges', 50, yPosition);
      yPosition += 15;
      doc.text('• Please contact us for any billing inquiries', 50, yPosition);

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

// Setup email transporter
const createEmailTransporter = () => {
  // Validate required environment variables
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.');
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send invoice email
const sendInvoiceEmail = async (invoice, customMessage = '') => {
  try {
    const transporter = createEmailTransporter();
    
    // Generate PDF
    const pdfBuffer = await generatePDF(invoice);
    
    const tenantEmail = invoice.tenantId?.userId?.email;
    const tenantName = invoice.tenantId?.userId?.name || 'Dear Tenant';
    const pgName = invoice.pgId?.name || 'PG';
    const ownerName = invoice.ownerId?.name || 'PG Management';

    if (!tenantEmail) {
      throw new Error('Tenant email not found');
    }

    const subject = `Invoice ${invoice.invoiceNumber} - ${pgName}`;
    
    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice from ${pgName}</h2>
        
        <p>Dear ${tenantName},</p>
        
        <p>Please find attached your invoice details:</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
              <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0;">${formatCurrency(invoice.totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Due Date:</strong></td>
              <td style="padding: 8px 0;">${formatDate(invoice.dueDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Status:</strong></td>
              <td style="padding: 8px 0;"><span style="padding: 4px 8px; background-color: ${invoice.status === 'paid' ? '#4CAF50' : '#FF9800'}; color: white; border-radius: 3px;">${invoice.status.toUpperCase()}</span></td>
            </tr>
          </table>
        </div>
        
        ${customMessage ? `<p><strong>Message:</strong> ${customMessage}</p>` : ''}
        
        <p>If you have already made the payment, please ignore this email. For any queries, please contact us.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 5px 0;"><strong>Contact Information:</strong></p>
          <p style="margin: 5px 0;">Name: ${ownerName}</p>
          ${invoice.ownerId?.email ? `<p style="margin: 5px 0;">Email: ${invoice.ownerId.email}</p>` : ''}
          ${invoice.ownerId?.phone ? `<p style="margin: 5px 0;">Phone: ${invoice.ownerId.phone}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Thank you for choosing ${pgName}!
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"${ownerName}" <${process.env.SMTP_USER}>`,
      to: tenantEmail,
      subject: subject,
      html: emailBody,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    return result;

  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

// Send payment reminder
const sendPaymentReminder = async (invoice, reminderType = 'gentle') => {
  try {
    const transporter = createEmailTransporter();
    const tenantEmail = invoice.tenantId?.userId?.email;
    const tenantName = invoice.tenantId?.userId?.name || 'Dear Tenant';
    const pgName = invoice.pgId?.name || 'PG';
    const ownerName = invoice.ownerId?.name || 'PG Management';

    if (!tenantEmail) {
      throw new Error('Tenant email not found');
    }

    let subject, emailBody;

    switch (reminderType) {
      case 'gentle':
        subject = `Payment Reminder - Invoice ${invoice.invoiceNumber}`;
        emailBody = `
          <p>Dear ${tenantName},</p>
          <p>This is a gentle reminder that your payment for invoice ${invoice.invoiceNumber} is due on ${formatDate(invoice.dueDate)}.</p>
          <p>Amount Due: ${formatCurrency(invoice.totalAmount)}</p>
          <p>Please make the payment at your earliest convenience.</p>
        `;
        break;
      
      case 'urgent':
        subject = `URGENT: Payment Overdue - Invoice ${invoice.invoiceNumber}`;
        emailBody = `
          <p>Dear ${tenantName},</p>
          <p><strong>URGENT:</strong> Your payment for invoice ${invoice.invoiceNumber} was due on ${formatDate(invoice.dueDate)} and is now overdue.</p>
          <p>Amount Due: ${formatCurrency(invoice.totalAmount)}</p>
          <p>Please make the payment immediately to avoid any inconvenience.</p>
        `;
        break;
      
      default:
        subject = `Payment Reminder - Invoice ${invoice.invoiceNumber}`;
        emailBody = `
          <p>Dear ${tenantName},</p>
          <p>We would like to remind you about the pending payment for invoice ${invoice.invoiceNumber}.</p>
          <p>Amount Due: ${formatCurrency(invoice.totalAmount)}</p>
          <p>Due Date: ${formatDate(invoice.dueDate)}</p>
        `;
    }

    const fullEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder - ${pgName}</h2>
        ${emailBody}
        <p>If you have already made the payment, please ignore this email.</p>
        <p>Thank you for your cooperation.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p><strong>Contact:</strong> ${ownerName}</p>
          ${invoice.ownerId?.phone ? `<p>Phone: ${invoice.ownerId.phone}</p>` : ''}
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${ownerName}" <${process.env.SMTP_USER}>`,
      to: tenantEmail,
      subject: subject,
      html: fullEmailBody
    };

    const result = await transporter.sendMail(mailOptions);
    return result;

  } catch (error) {
    console.error('Error sending payment reminder:', error);
    throw error;
  }
};

// Check and update overdue invoices
const checkOverdueInvoices = async () => {
  try {
    const { default: Invoice } = await import('../models/Invoice.js');
    
    const currentDate = new Date();
    const overdueInvoices = await Invoice.find({
      status: 'pending',
      dueDate: { $lt: currentDate }
    });

    if (overdueInvoices.length > 0) {
      await Invoice.updateMany(
        {
          status: 'pending',
          dueDate: { $lt: currentDate }
        },
        { status: 'overdue' }
      );

      console.log(`Updated ${overdueInvoices.length} invoices to overdue status`);
    }

    return overdueInvoices;

  } catch (error) {
    console.error('Error checking overdue invoices:', error);
    throw error;
  }
};

// Generate recurring invoices
const generateRecurringInvoices = async () => {
  try {
    const { default: Tenant } = await import('../models/Tenant.js');
    const { default: Invoice } = await import('../models/Invoice.js');
    
    // Find active tenants
    const activeTenants = await Tenant.find({ 
      status: 'active',
      nextBillingDate: { $lte: new Date() }
    }).populate('roomId pgId userId');

    const newInvoices = [];

    for (const tenant of activeTenants) {
      if (!tenant.roomId || !tenant.pgId) continue;

      // Check if invoice already exists for this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const existingInvoice = await Invoice.findOne({
        tenantId: tenant._id,
        createdAt: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });

      if (existingInvoice) continue;

      // Create new invoice
      const invoiceNumber = await generateInvoiceNumber();
      const dueDate = calculateDueDate(new Date(), 30);

      const invoice = new Invoice({
        invoiceNumber,
        tenantId: tenant._id,
        roomId: tenant.roomId._id,
        pgId: tenant.pgId._id,
        ownerId: tenant.pgId.ownerId,
        amount: tenant.roomId.rent,
        totalAmount: tenant.roomId.rent,
        dueDate,
        description: `Monthly rent for Room ${tenant.roomId.roomNumber} - ${tenant.pgId.name}`,
        invoiceType: 'monthly_rent',
        items: [{
          description: `Monthly rent for Room ${tenant.roomId.roomNumber}`,
          quantity: 1,
          rate: tenant.roomId.rent,
          amount: tenant.roomId.rent
        }],
        status: 'pending'
      });

      await invoice.save();
      newInvoices.push(invoice);

      // Update tenant's next billing date
      tenant.nextBillingDate = new Date(tenant.nextBillingDate.setMonth(tenant.nextBillingDate.getMonth() + 1));
      await tenant.save();
    }

    console.log(`Generated ${newInvoices.length} recurring invoices`);
    return newInvoices;

  } catch (error) {
    console.error('Error generating recurring invoices:', error);
    throw error;
  }
};

export {
  generateInvoiceNumber,
  calculateTax,
  calculateDueDate,
  formatCurrency,
  formatDate,
  generatePDF,
  sendInvoiceEmail,
  sendPaymentReminder,
  checkOverdueInvoices,
  generateRecurringInvoices
};
