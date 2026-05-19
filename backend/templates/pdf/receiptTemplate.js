import PDFDocument from "pdfkit";

export const generateReceiptPDF = (doc, data) => {
  // Helper functions
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      signDisplay: "never"
    }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  // Brand Colors - Using red from frontend (#dc2626 = red-600)
  const brandRed = "#dc2626";       // Red-600 (primary brand)
  const brandRedLight = "#ef4444";  // Red-500 (lighter accent)
  const brandRedDark = "#b91c1c";   // Red-700 (darker)
  const darkSlate = "#0f172a";    // Slate-900
  const slate700 = "#334155";      // Slate-700
  const slate500 = "#64748b";      // Slate-500
  const slate300 = "#cbd5e1";      // Slate-300
  const slate100 = "#f1f5f9";    // Slate-100
  const white = "#ffffff";
  const successGreen = "#22c55e";  // Green-500
  
  const pageWidth = 595; // A4 width
  const pageHeight = 842; // A4 height
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);
  const centerX = pageWidth / 2;

  let currentY = margin;

  // ============ HEADER ============
  // Gradient effect - Red bar at top
  doc.fillColor(brandRed).rect(margin, currentY, contentWidth, 8).fill();
  
  currentY += 15;
  
  // Company name - Centered (Red brand color)
  doc.fillColor(brandRed).fontSize(30).font("Helvetica-Bold").text(
    "6Pack Iron City",
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 35;
  
  // Receipt title
  doc.fillColor(darkSlate).fontSize(18).font("Helvetica-Bold").text(
    "OFFICIAL RECEIPT",
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 25;
  
  // Receipt number
  doc.fillColor(slate500).fontSize(10).font("Helvetica").text(
    `Receipt No. ${data.receipt_number || data.external_id || "N/A"}`,
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 30;

  // ============ HORIZONTAL LINE ============
  doc.strokeColor(slate300).lineWidth(2).moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke();
  
  currentY += 20;

  // ============ BILL TO SECTION ============
  // Section label - Centered
  doc.fillColor(brandRed).fontSize(10).font("Helvetica-Bold").text(
    "BILL TO",
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 15;
  
  // Card background
  doc.fillColor(slate100).rect(margin, currentY, contentWidth, 70).fill();
  
  currentY += 12;
  
  // client name - Centered
  doc.fillColor(darkSlate).fontSize(14).font("Helvetica-Bold").text(
    `${data.first_name || "client"} ${data.last_name || ""}`.trim(),
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 18;
  
  // Email
  doc.fillColor(slate500).fontSize(11).font("Helvetica").text(
    data.email || "No email",
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 18;
  
  // Phone
  if (data.phone) {
    doc.fillColor(slate500).fontSize(11).text(
      data.phone,
      margin,
      currentY,
      { align: "center", width: contentWidth }
    );
  }
  
  currentY += 40;

  // ============ DATE AND STATUS ============
  // Date on left
  doc.fillColor(slate500).fontSize(10).font("Helvetica").text("Date:", margin, currentY);
  doc.fillColor(darkSlate).fontSize(11).font("Helvetica-Bold").text(
    formatDate(data.createdAt || data.date || new Date()),
    margin,
    currentY + 14
  );
  
  // Status badge on right
  const statusText = data.status?.toUpperCase() || "PAID";
  const statusBg = statusText === "PAID" ? successGreen : slate500;
  doc.fillColor(statusBg).rect(margin + contentWidth - 90, currentY - 2, 90, 24).fill();
  doc.fillColor(white).fontSize(10).font("Helvetica-Bold").text(
    statusText,
    margin + contentWidth - 90,
    currentY + 2,
    { align: "center", width: 90 }
  );
  
  currentY += 40;

  // ============ PAYMENT DETAILS TABLE ============
  // Table header with red color
  doc.fillColor(brandRed).rect(margin, currentY, contentWidth, 32).fill();
  
  doc.fillColor(white).fontSize(10).font("Helvetica-Bold");
  doc.text("DESCRIPTION", margin + 20, currentY + 10);
  doc.text("DATE", margin + 280, currentY + 10);
  doc.text("AMOUNT", margin + contentWidth - 100, currentY + 10, { align: "right" });
  
  currentY += 32;
  
  // Table row
  doc.fillColor(slate100).rect(margin, currentY, contentWidth, 45).fill();
  
  doc.fillColor(darkSlate).fontSize(12).font("Helvetica");
  doc.text(data.payment_for || "Payment", margin + 20, currentY + 15);
  
  doc.fillColor(slate700).fontSize(11).text(
    formatDate(data.date || data.createdAt || new Date()),
    margin + 280,
    currentY + 16
  );
  
  doc.fillColor(brandRed).fontSize(14).font("Helvetica-Bold").text(
    formatCurrency(data.amount || 0),
    margin + contentWidth - 100,
    currentY + 14,
    { align: "right" }
  );
  
  currentY += 55;

  // ============ SUMMARY ============
  // Divider
  doc.strokeColor(slate300).lineWidth(1).moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke();
  
  currentY += 15;
  
  // Payment Method
  doc.fillColor(slate500).fontSize(11).font("Helvetica").text("Payment Method:", margin + 200, currentY);
  doc.fillColor(darkSlate).fontSize(11).font("Helvetica-Bold").text(
    (data.payment_method || "N/A").toUpperCase(),
    margin + 320,
    currentY
  );
  
  currentY += 30;

  // ============ TOTAL PAID BOX ============
  // Red brand box
  doc.fillColor(brandRed).rect(margin, currentY, contentWidth, 55).fill();
  
  doc.fillColor(white).fontSize(16).font("Helvetica-Bold").text(
    "TOTAL PAID:",
    margin + 20,
    currentY + 18
  );
  
  // Large total amount
  doc.fillColor(white).fontSize(24).font("Helvetica-Bold").text(
    formatCurrency(data.amount || 0),
    margin + 20,
    currentY + 35
  );
  
  currentY += 70;

  // ============ TRANSACTION DETAILS ============
  // Divider
  doc.strokeColor(slate300).lineWidth(1).moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke();
  
  currentY += 15;
  
  // Reference No
  if (data.reference_no) {
    doc.fillColor(slate500).fontSize(10).font("Helvetica").text("Reference No:", margin, currentY);
    doc.fillColor(darkSlate).fontSize(11).font("Helvetica-Bold").text(data.reference_no, margin, currentY + 14);
    currentY += 32;
  }
  
  // Transaction ID
  if (data.external_id) {
    doc.fillColor(slate500).fontSize(10).text("Transaction ID:", margin, currentY);
    doc.fillColor(darkSlate).fontSize(11).font("Helvetica-Bold").text(data.external_id, margin, currentY + 14);
  }
  
  currentY += 40;

  // ============ FOOTER ============
  doc.strokeColor(slate300).lineWidth(2).moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke();
  
  currentY += 15;
  
  // Thank you message in brand color
  doc.fillColor(brandRed).fontSize(12).font("Helvetica-Bold").text(
    "Thank you for choosing 6Pack Iron City!",
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 20;
  
  // Disclaimer
  doc.fillColor(slate500).fontSize(8).font("Helvetica").text(
    "This is an official receipt. Please keep this document for your records.",
    margin,
    currentY,
    { align: "center", width: contentWidth }
  );
  
  currentY += 20;
  
  // Copyright
  doc.fillColor(slate500).fontSize(7).font("Helvetica").text(
    "6Pack Iron City Gym • All Rights Reserved",
    margin,
    pageHeight - 25,
    { align: "center", width: contentWidth }
  );

  return doc;
};

export const generatemembershipReceiptPDF = (doc, data) => {
  return generateReceiptPDF(doc, {
    ...data,
    payment_for: data.type || "membership",
    amount: data.amount,
    date: data.date || data.createdAt,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    status: data.status,
    external_id: data.external_id,
    reference_no: data.reference_no,
    receipt_number: data.receipt_number,
    createdAt: data.createdAt
  });
};

export default generateReceiptPDF;