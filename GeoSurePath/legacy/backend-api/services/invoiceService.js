const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const fs = require('fs');
const path = require('path');

/**
 * Generates a professional PDF invoice for a transaction.
 * @param {object} data Invoice details (client name, amount, plan, taxi ID, etc.)
 * @returns {Promise<string>} Path to the generated PDF.
 */
const generateInvoice = async (data) => {
    const doc = new jsPDF();
    const { clientName, email, planName, amount, paymentId, date } = data;

    // Header
    doc.setFontSize(20);
    doc.text('GeoSurePath - INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('GeoSurePath Technologies Pvt Ltd', 10, 30);
    doc.text('Bangalore, Karnataka, India', 10, 35);
    doc.text('GSTIN: 29AAAAA0000A1Z5', 10, 40);

    // Client Info
    doc.line(10, 45, 200, 45);
    doc.text(`Bill To: ${clientName}`, 10, 55);
    doc.text(`Email: ${email}`, 10, 60);
    doc.text(`Invoice Date: ${date || new Date().toLocaleDateString()}`, 140, 55);
    doc.text(`Payment ID: ${paymentId}`, 140, 60);

    // Table
    const tableData = [
        ['Description', 'Quantity', 'Unit Price', 'Total'],
        [`GeoSurePath SaaS Subscription - ${planName}`, '1', `INR ${amount}`, `INR ${amount}`],
    ];

    doc.autoTable({
        startY: 70,
        head: [['Description', 'Qty', 'Price', 'Total']],
        body: [[`GeoSurePath SaaS - ${planName}`, '1', `INR ${amount}`, `INR ${amount}`]],
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 153] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Amount: INR ${amount}`, 140, finalY);
    doc.text('(Inclusive of 18% GST)', 140, finalY + 5);

    // Footer
    doc.text('Thank you for choosing GeoSurePath!', 105, finalY + 30, { align: 'center' });

    // Save to disk
    const filename = `invoice_${paymentId}.pdf`;
    const outputDir = path.join(__dirname, '..', 'invoices');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, filename);
    const pdfOutput = doc.output('arraybuffer');
    fs.writeFileSync(outputPath, Buffer.from(pdfOutput));

    return outputPath;
};

module.exports = { generateInvoice };
