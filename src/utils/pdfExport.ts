import { jsPDF } from "jspdf";
import { Project, Resource } from "../types";

export function generateExecutivePDF(projects: Project[], resources: Resource[]) {
  // 1. Initialize Portrait A4 jsPDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Dimensions of A4 are 210mm x 297mm
  const marginX = 15;
  let currentY = 15;

  // Helper function for text lines
  const addHeaderBand = () => {
    // Navy Header Background Box
    doc.setFillColor(27, 42, 74); // #1B2A4A
    doc.rect(0, 0, 210, 38, "F");

    // Gold Accent Border
    doc.setFillColor(166, 124, 0); // #A67C00
    doc.rect(0, 38, 210, 2, "F");

    // Corporate Typography Header
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("INNOVATION CONSULT (PTY) LTD", marginX, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text("Potchefstroom PMO Office  |  Reg. No. 2007/021390/07", marginX, 21);

    doc.setFont("helvetica", "italic");
    doc.setTextColor(166, 124, 0); // Gold
    doc.text('"knowledge to action."', marginX, 26);

    // Document Title Align Right
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("EXECUTIVE PMO REPORT", 195, 16, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 220);
    const dateStr = new Date().toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Generated: ${dateStr}`, 195, 22, { align: "right" });
    
    currentY = 48;
  };

  // 2. Build Header
  addHeaderBand();

  // 3. Document Subtitle & Meta Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(27, 42, 74);
  doc.text("STRATEGIC PORTFOLIO SUMMARY & HEALTH BRIEF", marginX, currentY);
  currentY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "This report comprises live performance metrics, financial investments, and milestone execution schedules compiled for Innovation Consult (Pty) Ltd executive stakeholders.",
    marginX,
    currentY,
    { maxWidth: 180 }
  );
  currentY += 12;

  // 4. Calculate KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status !== "Completed").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;
  
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.actualSpent, 0);
  const variance = totalBudget - totalSpent;
  const isOverSpent = variance < 0;

  const avgCpi = parseFloat(
    (projects.reduce((sum, p) => sum + p.cpi, 0) / (projects.length || 1)).toFixed(2)
  );
  const avgSpi = parseFloat(
    (projects.reduce((sum, p) => sum + p.spi, 0) / (projects.length || 1)).toFixed(2)
  );

  const formatZAR = (val: number) => {
    return "R " + new Intl.NumberFormat("en-ZA", {
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Draw KPI Boxes
  const drawKPIBoxes = () => {
    const boxW = 56;
    const boxH = 18;
    const gap = 6;

    // Box 1: Projects count
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX, currentY, boxW, boxH, "F");
    doc.setDrawColor(229, 231, 235);
    doc.rect(marginX, currentY, boxW, boxH, "S");
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("PORTFOLIO PROJECTS", marginX + 4, currentY + 5);
    doc.setTextColor(27, 42, 74);
    doc.setFontSize(11);
    doc.text(`${totalProjects} Total (${activeProjects} Active)`, marginX + 4, currentY + 12);

    // Box 2: Total Investment
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX + boxW + gap, currentY, boxW, boxH, "F");
    doc.rect(marginX + boxW + gap, currentY, boxW, boxH, "S");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("PLANNED INVESTMENT BUDGET", marginX + boxW + gap + 4, currentY + 5);
    doc.setTextColor(27, 42, 74);
    doc.setFontSize(11);
    doc.text(formatZAR(totalBudget), marginX + boxW + gap + 4, currentY + 12);

    // Box 3: Total spent
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX + (boxW + gap) * 2, currentY, boxW, boxH, "F");
    doc.rect(marginX + (boxW + gap) * 2, currentY, boxW, boxH, "S");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("CUMULATIVE EXPENDITURE", marginX + (boxW + gap) * 2 + 4, currentY + 5);
    doc.setTextColor(isOverSpent ? 125 : 27, isOverSpent ? 27 : 124, isOverSpent ? 52 : 0); // Burgundy text if overspent
    doc.setFontSize(11);
    doc.text(formatZAR(totalSpent), marginX + (boxW + gap) * 2 + 4, currentY + 12);

    currentY += boxH + 6;

    // Second Row KPI Boxes
    // Box 4: Financial Variance
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX, currentY, boxW, boxH, "F");
    doc.rect(marginX, currentY, boxW, boxH, "S");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("PORTFOLIO NET VARIANCE", marginX + 4, currentY + 5);
    doc.setTextColor(isOverSpent ? 125 : 22, isOverSpent ? 27 : 101, isOverSpent ? 52 : 52); // Burgundy/Green
    doc.setFontSize(10);
    doc.text(`${isOverSpent ? "Deficit" : "Surplus"}: ${formatZAR(Math.abs(variance))}`, marginX + 4, currentY + 12);

    // Box 5: Avg Cost Index (CPI)
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX + boxW + gap, currentY, boxW, boxH, "F");
    doc.rect(marginX + boxW + gap, currentY, boxW, boxH, "S");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("AVG COST PERFORMANCE (CPI)", marginX + boxW + gap + 4, currentY + 5);
    doc.setTextColor(avgCpi >= 1.0 ? 22 : 125, avgCpi >= 1.0 ? 101 : 27, avgCpi >= 1.0 ? 52 : 52);
    doc.setFontSize(11);
    doc.text(`${avgCpi.toFixed(2)} (${avgCpi >= 1.0 ? "Under Budget" : "Over Budget"})`, marginX + boxW + gap + 4, currentY + 12);

    // Box 6: Avg Schedule Index (SPI)
    doc.setFillColor(243, 244, 246);
    doc.rect(marginX + (boxW + gap) * 2, currentY, boxW, boxH, "F");
    doc.rect(marginX + (boxW + gap) * 2, currentY, boxW, boxH, "S");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("AVG SCHEDULE VELOCITY (SPI)", marginX + (boxW + gap) * 2 + 4, currentY + 5);
    doc.setTextColor(avgSpi >= 1.0 ? 22 : 166, avgSpi >= 1.0 ? 101 : 124, avgSpi >= 1.0 ? 52 : 0);
    doc.setFontSize(11);
    doc.text(`${avgSpi.toFixed(2)} (${avgSpi >= 1.0 ? "On Track" : "Behind Schedule"})`, marginX + (boxW + gap) * 2 + 4, currentY + 12);

    currentY += boxH + gap + 4;
  };

  drawKPIBoxes();

  // 5. Draw Project Table Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(27, 42, 74);
  doc.text("CORPORATE STRATEGIC PROJECTS REGISTRY", marginX, currentY);
  currentY += 5;

  // Draw Table Headers
  const drawTableHeader = () => {
    doc.setFillColor(27, 42, 74); // Navy Header
    doc.rect(marginX, currentY, 180, 7, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    
    doc.text("PROJECT / CLIENT OVERVIEW", marginX + 3, currentY + 4.8);
    doc.text("VERTICAL / PM", marginX + 50, currentY + 4.8);
    doc.text("STATUS", marginX + 90, currentY + 4.8);
    doc.text("BUDGET (ZAR)", marginX + 115, currentY + 4.8);
    doc.text("CPI / SPI", marginX + 150, currentY + 4.8);
    doc.text("PROGRESS", marginX + 168, currentY + 4.8);

    currentY += 7;
  };

  drawTableHeader();

  // Draw Project Rows
  projects.forEach((p, idx) => {
    // Check page limits
    if (currentY > 265) {
      doc.addPage();
      currentY = 15;
      addHeaderBand();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(27, 42, 74);
      doc.text("STRATEGIC PROJECTS REGISTRY (CONTINUED)", marginX, currentY);
      currentY += 5;
      
      drawTableHeader();
    }

    // Row zebra stripes
    if (idx % 2 === 0) {
      doc.setFillColor(250, 251, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(marginX, currentY, 180, 14, "F");

    // Thin grey dividing line
    doc.setDrawColor(240, 240, 240);
    doc.line(marginX, currentY + 14, marginX + 180, currentY + 14);

    // Columns drawing
    // Column 1: Project details
    doc.setTextColor(27, 42, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(p.name.length > 25 ? p.name.substring(0, 23) + "..." : p.name, marginX + 3, currentY + 5.5);

    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`End: ${p.endDate}`, marginX + 3, currentY + 10);

    // Column 2: Dept & Manager
    doc.setTextColor(27, 42, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(p.department.length > 20 ? p.department.substring(0, 18) + "..." : p.department, marginX + 50, currentY + 5.5);

    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(p.manager.split(" ").slice(-1)[0] || p.manager, marginX + 50, currentY + 10);

    // Column 3: Status
    let r = 27, g = 42, b = 74; // default Navy
    if (p.status === "On Track") { r = 22; g = 101; b = 52; } // Green
    else if (p.status === "At Risk") { r = 166; g = 124; b = 0; } // Gold
    else if (p.status === "Critical") { r = 125; g = 27; b = 52; } // Burgundy
    else if (p.status === "Completed") { r = 30; g = 64; b = 175; } // Blue

    doc.setFillColor(r, g, b);
    doc.rect(marginX + 90, currentY + 4, 18, 5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(p.status.toUpperCase(), marginX + 99, currentY + 7.5, { align: "center" });

    // Column 4: Budget
    doc.setTextColor(27, 42, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(formatZAR(p.budget), marginX + 115, currentY + 5.5);

    const varianceVal = p.budget - p.actualSpent;
    const isOver = varianceVal < 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(isOver ? 125 : 22, isOver ? 27 : 101, isOver ? 52 : 52);
    doc.text(`${isOver ? "Over" : "Surplus"}: ${formatZAR(Math.abs(varianceVal))}`, marginX + 115, currentY + 10);

    // Column 5: CPI / SPI indices
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(p.cpi >= 1.0 ? 22 : 125, p.cpi >= 1.0 ? 101 : 27, p.cpi >= 1.0 ? 52 : 52);
    doc.text(`C:${p.cpi.toFixed(2)}`, marginX + 150, currentY + 5.5);
    
    doc.setTextColor(p.spi >= 1.0 ? 22 : 166, p.spi >= 1.0 ? 101 : 124, p.spi >= 1.0 ? 52 : 0);
    doc.text(`S:${p.spi.toFixed(2)}`, marginX + 150, currentY + 10);

    // Column 6: Progress Bar
    doc.setTextColor(27, 42, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${p.progress}%`, marginX + 168, currentY + 5.5);

    // Draw little vector bar
    doc.setFillColor(220, 220, 220);
    doc.rect(marginX + 168, currentY + 8, 10, 1.5, "F");
    doc.setFillColor(166, 124, 0); // Gold
    doc.rect(marginX + 168, currentY + 8, 10 * (p.progress / 100), 1.5, "F");

    currentY += 14;
  });

  // Bottom Signature Block
  currentY += 12;
  if (currentY > 240) {
    doc.addPage();
    currentY = 15;
    addHeaderBand();
    currentY += 10;
  }

  // Draw Signature line
  doc.setDrawColor(166, 124, 0); // Gold
  doc.line(marginX, currentY, marginX + 50, currentY);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(27, 42, 74);
  doc.text("PMO Director Authorization", marginX, currentY + 4);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Innovation Consult (Pty) Ltd Portfolio Committee", marginX, currentY + 8);

  // Footer on current page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Innovation Consult (Pty) Ltd  |  Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
    doc.text("CONFIDENTIAL — INTEGRATED CORPORATE STRATEGY OFFICE REPORT", marginX, 290);
  }

  // 6. Save the Generated Report file
  doc.save(`Innovation_Consult_PMO_Executive_Report_${Date.now()}.pdf`);
}
