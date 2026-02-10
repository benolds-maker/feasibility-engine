import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatPercent, formatNumber, formatSqm } from '../utils/format.js';

const COLORS = {
  primary: [5, 150, 105],      // emerald-600
  primaryDark: [4, 120, 87],
  dark: [15, 23, 42],           // slate-900
  medium: [100, 116, 139],      // slate-500
  light: [226, 232, 240],       // slate-300
  white: [255, 255, 255],
  green: [22, 163, 74],
  amber: [217, 119, 6],
  red: [220, 38, 38],
  greenBg: [236, 253, 245],
  amberBg: [255, 251, 235],
  redBg: [254, 242, 242],
  sectionBg: [248, 250, 252],   // slate-50
};

function addHeader(doc, title, pageNum, totalPages, companyName) {
  // Header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 12);
  if (companyName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(companyName, 196, 12, { align: 'right' });
  }

  // Footer
  doc.setTextColor(...COLORS.medium);
  doc.setFontSize(7);
  doc.text(`Page ${pageNum} of ${totalPages}`, 105, 290, { align: 'center' });
  doc.text('CONFIDENTIAL — Preliminary Assessment Only', 105, 294, { align: 'center' });
}

function addSectionTitle(doc, y, title) {
  doc.setFillColor(...COLORS.primaryDark);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 18, y + 5.5);
  return y + 12;
}

function addSubTitle(doc, y, title) {
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  return y + 5;
}

function addText(doc, y, text, x = 14) {
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(text, x, y);
  return y + 4;
}

function addKeyValue(doc, y, key, value, x = 14) {
  doc.setTextColor(...COLORS.medium);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(key, x, y);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text(String(value), x + 60, y);
  return y + 5;
}

export function generatePDF(results, formData) {
  const { feasibility, yieldResult, compliance, riskAssessment } = results;
  const { revenue, costs, profitability, breakeven, sensitivity, metadata } = feasibility;

  const doc = new jsPDF('p', 'mm', 'a4');
  const totalPages = 10;
  const companyName = formData.companyName || '';
  const address = formData.address || 'Property Address';
  const reportTitle = formData.reportTitle || `Feasibility Assessment — ${address}`;
  const dateStr = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // ══════════════════════════════════════════════
  // PAGE 1: Executive Summary
  // ══════════════════════════════════════════════
  addHeader(doc, 'EXECUTIVE SUMMARY', 1, totalPages, companyName);
  let y = 28;

  // Title block
  doc.setFillColor(...COLORS.sectionBg);
  doc.roundedRect(14, y, 182, 28, 3, 3, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Development Feasibility Report', 20, y + 10);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text(address, 20, y + 17);
  doc.text(`Report Date: ${dateStr}`, 20, y + 23);
  y += 36;

  // Recommendation box
  const recColor = riskAssessment.recommendationLevel === 'green' ? COLORS.green
    : riskAssessment.recommendationLevel === 'amber' ? COLORS.amber : COLORS.red;
  const recBg = riskAssessment.recommendationLevel === 'green' ? COLORS.greenBg
    : riskAssessment.recommendationLevel === 'amber' ? COLORS.amberBg : COLORS.redBg;
  const recLabel = riskAssessment.recommendationLevel === 'green' ? 'RECOMMENDED'
    : riskAssessment.recommendationLevel === 'amber' ? 'PROCEED WITH CAUTION' : 'NOT RECOMMENDED';

  doc.setFillColor(...recBg);
  doc.roundedRect(14, y, 182, 16, 3, 3, 'F');
  doc.setDrawColor(...recColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, 182, 16, 3, 3, 'S');
  doc.setTextColor(...recColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(recLabel, 20, y + 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  const recLines = doc.splitTextToSize(riskAssessment.recommendation, 172);
  doc.text(recLines[0], 20, y + 12);
  y += 22;

  // Key Metrics Dashboard
  y = addSectionTitle(doc, y, 'KEY METRICS');

  const metrics = [
    ['Number of Dwellings', String(metadata.numDwellings)],
    ['Total Gross Floor Area', formatSqm(metadata.totalGFA)],
    ['Estimated GRV', formatCurrency(revenue.totalGRV)],
    ['Total Development Cost', formatCurrency(costs.totalDevelopmentCost)],
    ['Gross Profit', formatCurrency(profitability.grossProfit)],
    ['Profit Margin', formatPercent(profitability.profitMargin)],
    ['Return on Cost', formatPercent(profitability.returnOnCost)],
    ['Return on Equity', formatPercent(profitability.returnOnEquity)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: metrics,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: COLORS.sectionBg },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 'auto' },
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Project summary
  y = addSectionTitle(doc, y, 'PROJECT SUMMARY');
  y = addKeyValue(doc, y + 4, 'Address:', address);
  y = addKeyValue(doc, y, 'Zoning:', formData.rCode || 'N/A');
  y = addKeyValue(doc, y, 'Lot Area:', formatSqm(formData.lotArea || 0));
  y = addKeyValue(doc, y, 'Construction Quality:', metadata.constructionQuality);
  y = addKeyValue(doc, y, 'Timeline:', `${metadata.timelineMonths} months`);
  y = addKeyValue(doc, y, 'Financing:', `${formatPercent(metadata.debtRatio, 0)} debt / ${formatPercent(1 - metadata.debtRatio, 0)} equity`);

  // ══════════════════════════════════════════════
  // PAGE 2: Site Analysis
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'SITE ANALYSIS', 2, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'LOCATION & SITE DETAILS');
  y += 4;
  y = addKeyValue(doc, y, 'Address:', address);
  y = addKeyValue(doc, y, 'Suburb:', formData.suburb || 'N/A');
  y = addKeyValue(doc, y, 'Postcode:', formData.postcode || 'N/A');
  y = addKeyValue(doc, y, 'Lot/Plan:', formData.lotPlan || 'N/A');
  y += 4;

  y = addSectionTitle(doc, y, 'SITE DIMENSIONS');
  y += 4;
  y = addKeyValue(doc, y, 'Total Lot Area:', formatSqm(formData.lotArea || 0));
  y = addKeyValue(doc, y, 'Lot Width:', `${formData.lotWidth || 0}m`);
  y = addKeyValue(doc, y, 'Lot Depth:', `${formData.lotDepth || 0}m`);
  y = addKeyValue(doc, y, 'Current Zoning:', formData.rCode || 'N/A');
  y += 4;

  y = addSectionTitle(doc, y, 'PLANNING OVERLAYS');
  y += 4;
  const overlays = [
    ['Heritage Overlay', formData.heritageOverlay],
    ['Bushfire Prone', formData.bushfireProne],
    ['Flood Risk', formData.floodRisk],
    ['Contaminated Site', formData.contaminatedSite],
    ['Tree Preservation', formData.treePO],
    ['Acid Sulfate Soils', formData.acidSulfateSoils],
  ];
  overlays.forEach(([label, active]) => {
    doc.setTextColor(...COLORS.medium);
    doc.setFontSize(8);
    doc.text(label, 20, y);
    doc.setTextColor(...(active ? COLORS.red : COLORS.green));
    doc.setFont('helvetica', 'bold');
    doc.text(active ? 'YES — IDENTIFIED' : 'Not identified', 80, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
  });
  y += 4;

  y = addSectionTitle(doc, y, 'SITE CHARACTERISTICS');
  y += 4;
  y = addKeyValue(doc, y, 'Topography:', (formData.siteSlope || 'flat').charAt(0).toUpperCase() + (formData.siteSlope || 'flat').slice(1));
  y = addKeyValue(doc, y, 'Lot Shape:', (formData.lotShape || 'regular').replace('_', ' ').replace(/^\w/, c => c.toUpperCase()));
  y = addKeyValue(doc, y, 'Street Frontage:', (formData.streetFrontage || 'adequate').replace(/^\w/, c => c.toUpperCase()));
  y = addKeyValue(doc, y, 'Demolition Required:', formData.demolitionRequired ? 'Yes' : 'No');
  y = addKeyValue(doc, y, 'Significant Trees:', formData.largeTrees ? 'Yes' : 'No');

  // ══════════════════════════════════════════════
  // PAGE 3: Planning Assessment
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'PLANNING ASSESSMENT', 3, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'R-CODES COMPLIANCE SUMMARY');

  autoTable(doc, {
    startY: y + 2,
    head: [['Requirement', 'Allowed', 'Proposed', 'Status']],
    body: compliance.checks.map(c => [
      c.name,
      c.allowed,
      c.proposed,
      c.compliant ? 'COMPLIANT' : 'NON-COMPLIANT',
    ]),
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: COLORS.sectionBg },
    didParseCell(data) {
      if (data.column.index === 3 && data.section === 'body') {
        if (data.cell.raw === 'COMPLIANT') {
          data.cell.styles.textColor = COLORS.green;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = COLORS.red;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = addSectionTitle(doc, y, 'PLANNING CONSIDERATIONS');
  y += 4;
  y = addText(doc, y, `The subject site is zoned ${formData.rCode || 'N/A'} under the applicable Local Planning Scheme.`);
  y = addText(doc, y, `The proposed development of ${metadata.numDwellings} grouped dwellings is ${compliance.valid ? 'compliant' : 'subject to variations'}`);
  y = addText(doc, y, 'with the deemed-to-comply requirements of the Residential Design Codes.');
  y += 3;
  y = addText(doc, y, 'Estimated Planning Approval Timeline: 60-90 days for standard development application.');

  // ══════════════════════════════════════════════
  // PAGE 4: Development Yield
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'DEVELOPMENT YIELD', 4, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'DWELLING MIX');

  autoTable(doc, {
    startY: y + 2,
    head: [['Type', 'Quantity', 'Avg Size (sqm)', 'Total GFA (sqm)']],
    body: [
      ...yieldResult.dwellingDetails.map(d => [
        d.type,
        String(d.quantity),
        formatNumber(d.avgSize),
        formatNumber(d.totalGFA),
      ]),
      [{ content: 'TOTAL', styles: { fontStyle: 'bold' } },
       { content: String(metadata.numDwellings), styles: { fontStyle: 'bold' } },
       '',
       { content: formatNumber(metadata.totalGFA), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark, halign: 'right' },
    columnStyles: { 0: { halign: 'left' } },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = addSectionTitle(doc, y, 'PARKING ALLOCATION');
  y += 4;
  y = addKeyValue(doc, y, 'Resident Bays:', String(yieldResult.parking?.residentBays || 0));
  y = addKeyValue(doc, y, 'Visitor Bays:', String(yieldResult.parking?.visitorBays || 0));
  y = addKeyValue(doc, y, 'Total Parking:', `${yieldResult.parking?.totalBays || 0} bays`);
  y += 4;

  y = addSectionTitle(doc, y, 'SITE LAYOUT CONCEPT');
  y += 4;
  const layoutLines = doc.splitTextToSize(yieldResult.layoutDescription || '', 175);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8);
  doc.text(layoutLines, 14, y);

  // ══════════════════════════════════════════════
  // PAGE 5: Market Analysis
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'MARKET ANALYSIS', 5, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'PRICING ASSUMPTIONS');

  autoTable(doc, {
    startY: y + 2,
    head: [['Dwelling Type', 'Assumed Sale Price', 'Basis']],
    body: revenue.byType.map(r => [
      r.type,
      formatCurrency(r.priceEach),
      'Perth median / comparable sales',
    ]),
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: COLORS.sectionBg },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = addSectionTitle(doc, y, 'MARKET CONTEXT');
  y += 4;
  y = addKeyValue(doc, y, 'Market Trend:', (formData.marketTrend || 'stable').replace(/^\w/, c => c.toUpperCase()));
  y = addKeyValue(doc, y, 'Supply Level:', (formData.supplyLevel || 'normal').replace(/^\w/, c => c.toUpperCase()));
  y = addKeyValue(doc, y, 'Comparable Sales:', String(formData.comparableSalesCount || 10));
  y = addKeyValue(doc, y, 'Avg Days on Market:', String(formData.avgDaysOnMarket || 30));
  y += 4;

  y = addSectionTitle(doc, y, 'REVENUE SUMMARY');

  autoTable(doc, {
    startY: y + 2,
    head: [['Type', 'Quantity', 'Price Each', 'Total']],
    body: [
      ...revenue.byType.map(r => [
        r.type,
        String(r.quantity),
        formatCurrency(r.priceEach),
        formatCurrency(r.total),
      ]),
      [{ content: 'TOTAL GRV', styles: { fontStyle: 'bold' } },
       '', '',
       { content: formatCurrency(revenue.totalGRV), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark, halign: 'right' },
    columnStyles: { 0: { halign: 'left' } },
  });

  // ══════════════════════════════════════════════
  // PAGE 6: Cost Breakdown (Part 1)
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'COST BREAKDOWN', 6, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'DEVELOPMENT COST SUMMARY');

  const costData = [
    [{ content: 'LAND & ACQUISITION', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Land purchase price', formatCurrency(costs.land.purchasePrice)],
    ['  Stamp duty', formatCurrency(costs.land.stampDuty)],
    ['  Legal fees', formatCurrency(costs.land.legalFees)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.land.total), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'SITE PREPARATION', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Demolition', formatCurrency(costs.sitePrep.demolition)],
    ['  Site clearing', formatCurrency(costs.sitePrep.siteClearing)],
    ['  Earthworks', formatCurrency(costs.sitePrep.earthworks)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.sitePrep.total), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'CONSTRUCTION', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    [`  Building costs (${metadata.numDwellings} units @ $${formatNumber(costs.construction.ratePerSqm)}/sqm)`, formatCurrency(costs.construction.buildingCosts)],
    ['  Design contingency (4%)', formatCurrency(costs.construction.designContingency)],
    ['  Construction contingency (7%)', formatCurrency(costs.construction.constructionContingency)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.construction.total), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'SERVICES CONNECTION', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Water', formatCurrency(costs.services.water)],
    ['  Sewer', formatCurrency(costs.services.sewer)],
    ['  Power', formatCurrency(costs.services.power)],
    ['  Gas', formatCurrency(costs.services.gas)],
    ['  NBN/Telecommunications', formatCurrency(costs.services.nbn)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.services.total), styles: { fontStyle: 'bold' } }],
  ];

  autoTable(doc, {
    startY: y + 2,
    body: costData,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    bodyStyles: { fontSize: 8, textColor: COLORS.dark, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right' },
    },
  });

  // ══════════════════════════════════════════════
  // PAGE 7: Cost Breakdown (Part 2)
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'COST BREAKDOWN (CONTINUED)', 7, totalPages, companyName);
  y = 28;

  const costData2 = [
    [{ content: 'INFRASTRUCTURE', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Driveway/crossover', formatCurrency(costs.infrastructure.driveway)],
    ['  Access roads', formatCurrency(costs.infrastructure.accessRoads)],
    ['  Landscaping', formatCurrency(costs.infrastructure.landscaping)],
    ['  Fencing', formatCurrency(costs.infrastructure.fencing)],
    ['  Stormwater drainage', formatCurrency(costs.infrastructure.stormwater)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.infrastructure.total), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'PROFESSIONAL FEES', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Architect/designer (5.5%)', formatCurrency(costs.professional.architect)],
    ['  Structural engineer (1.5%)', formatCurrency(costs.professional.engineer)],
    ['  Geotechnical report', formatCurrency(costs.professional.geoReport)],
    ['  Surveyor', formatCurrency(costs.professional.surveyor)],
    ['  Town planner', formatCurrency(costs.professional.townPlanner)],
    ['  Building permit fees (1%)', formatCurrency(costs.professional.buildingPermit)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.professional.total), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'STATUTORY FEES', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Development application', formatCurrency(costs.statutory.devApplication)],
    ['  Building permits', formatCurrency(costs.statutory.buildingPermits)],
    ['  Water Corporation', formatCurrency(costs.statutory.waterCorp)],
    ['  Western Power', formatCurrency(costs.statutory.westernPower)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.statutory.total), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'FINANCE COSTS', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Establishment fees', formatCurrency(costs.finance.establishment)],
    ['  Interest during construction', formatCurrency(costs.finance.interest)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.finance.total), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'MARKETING & SALES', styles: { fontStyle: 'bold', fillColor: COLORS.sectionBg } }, ''],
    ['  Agent commission (2.5%)', formatCurrency(costs.marketing.agentCommission)],
    ['  Marketing campaign', formatCurrency(costs.marketing.campaign)],
    ['  Sales office/signage', formatCurrency(costs.marketing.salesOffice)],
    [{ content: '  Subtotal', styles: { fontStyle: 'bold' } }, { content: formatCurrency(costs.marketing.total), styles: { fontStyle: 'bold' } }],
  ];

  autoTable(doc, {
    startY: y,
    body: costData2,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    bodyStyles: { fontSize: 8, textColor: COLORS.dark, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right' },
    },
  });
  y = doc.lastAutoTable.finalY + 6;

  // Total box
  doc.setFillColor(...COLORS.dark);
  doc.roundedRect(14, y, 182, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DEVELOPMENT COST', 20, y + 7);
  doc.text(formatCurrency(costs.totalDevelopmentCost), 190, y + 7, { align: 'right' });

  // ══════════════════════════════════════════════
  // PAGE 8: Financial Analysis
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'FINANCIAL ANALYSIS', 8, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'REVENUE & PROFITABILITY');

  const finData = [
    [{ content: 'GROSS REALISATION VALUE', styles: { fontStyle: 'bold' } }, ''],
    ...revenue.byType.map(r => [`  ${r.quantity} × ${r.type} @ ${formatCurrency(r.priceEach)}`, formatCurrency(r.total)]),
    [{ content: '  Total GRV', styles: { fontStyle: 'bold' } }, { content: formatCurrency(revenue.totalGRV), styles: { fontStyle: 'bold' } }],
    ['', ''],
    ['Less: Total Development Cost', formatCurrency(costs.totalDevelopmentCost)],
    ['', ''],
    [{ content: 'GROSS PROFIT', styles: { fontStyle: 'bold', textColor: profitability.grossProfit >= 0 ? COLORS.green : COLORS.red } },
     { content: formatCurrency(profitability.grossProfit), styles: { fontStyle: 'bold', textColor: profitability.grossProfit >= 0 ? COLORS.green : COLORS.red } }],
  ];

  autoTable(doc, {
    startY: y + 2,
    body: finData,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 130 }, 1: { halign: 'right' } },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = addSectionTitle(doc, y, 'KEY METRICS');

  autoTable(doc, {
    startY: y + 2,
    body: [
      ['Profit Margin', formatPercent(profitability.profitMargin)],
      ['Return on Cost', formatPercent(profitability.returnOnCost)],
      [`Return on Equity (${formatPercent(1 - metadata.debtRatio, 0)} equity)`, formatPercent(profitability.returnOnEquity)],
    ],
    theme: 'grid',
    margin: { left: 14, right: 14 },
    bodyStyles: { fontSize: 10, textColor: COLORS.dark, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } },
    alternateRowStyles: { fillColor: COLORS.sectionBg },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = addSectionTitle(doc, y, 'BREAKEVEN ANALYSIS');
  y += 4;
  y = addKeyValue(doc, y, `Required GRV for ${formatPercent(breakeven.targetMargin, 0)} margin:`, formatCurrency(breakeven.requiredGRVForTarget));
  y = addKeyValue(doc, y, 'Current GRV vs Required:', breakeven.grvShortfall > 0 ? `Shortfall of ${formatCurrency(breakeven.grvShortfall)}` : 'Target exceeded');
  y = addKeyValue(doc, y, 'Breakeven price per unit:', formatCurrency(breakeven.breakEvenPricePerUnit));

  // ══════════════════════════════════════════════
  // PAGE 9: Sensitivity Analysis
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'SENSITIVITY ANALYSIS', 9, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'SCENARIO MATRIX: Impact on Profit Margin');

  autoTable(doc, {
    startY: y + 2,
    head: [['Factor', '-10%', '-5%', 'Base', '+5%', '+10%']],
    body: [
      ['Sales Prices', ...sensitivity.sales.map(s => formatPercent(s.margin))],
      ['Construction', ...sensitivity.construction.map(s => formatPercent(s.margin))],
      ['Land Cost', ...sensitivity.land.map(s => formatPercent(s.margin))],
    ],
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: COLORS.sectionBg },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = addSectionTitle(doc, y, 'TIMELINE SCENARIOS');

  autoTable(doc, {
    startY: y + 2,
    head: [['Scenario', 'Duration', 'Interest Cost', 'Profit Margin']],
    body: sensitivity.timeline.map(s => [
      s.label,
      `${s.months} months`,
      formatCurrency(s.interestCost),
      formatPercent(s.margin),
    ]),
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark },
    alternateRowStyles: { fillColor: COLORS.sectionBg },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = addSectionTitle(doc, y, 'KEY SENSITIVITIES');
  y += 4;
  y = addText(doc, y, `This project is most sensitive to: ${sensitivity.mostSensitive}`);
  y = addText(doc, y, `A 10% adverse movement in ${sensitivity.mostSensitive.toLowerCase()} would reduce the profit margin`);
  y = addText(doc, y, `from ${formatPercent(sensitivity.baseMargin)} to ${formatPercent(sensitivity.sales[0].margin)} (sales) / ${formatPercent(sensitivity.construction[4].margin)} (construction).`);

  // ══════════════════════════════════════════════
  // PAGE 10: Risk Assessment & Disclaimers
  // ══════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, 'RISK ASSESSMENT & DISCLAIMERS', 10, totalPages, companyName);
  y = 28;

  y = addSectionTitle(doc, y, 'IDENTIFIED RISKS');

  const riskTableData = riskAssessment.risks.map(r => [
    r.category,
    r.level.toUpperCase(),
    r.title,
    r.description.substring(0, 80) + (r.description.length > 80 ? '...' : ''),
  ]);

  autoTable(doc, {
    startY: y + 2,
    head: [['Category', 'Level', 'Risk', 'Description']],
    body: riskTableData,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: COLORS.dark },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
    },
    didParseCell(data) {
      if (data.column.index === 1 && data.section === 'body') {
        if (data.cell.raw === 'HIGH') {
          data.cell.styles.textColor = COLORS.red;
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'MEDIUM') {
          data.cell.styles.textColor = COLORS.amber;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = COLORS.green;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Recommendation box
  doc.setFillColor(...recBg);
  doc.roundedRect(14, y, 182, 20, 3, 3, 'F');
  doc.setDrawColor(...recColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, 182, 20, 3, 3, 'S');
  doc.setTextColor(...recColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`OVERALL: ${recLabel}`, 20, y + 8);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  const recTextLines = doc.splitTextToSize(riskAssessment.recommendation, 168);
  doc.text(recTextLines, 20, y + 14);
  y += 28;

  // Disclaimers
  y = addSectionTitle(doc, y, 'ASSUMPTIONS & DISCLAIMERS');
  y += 3;

  const assumptions = [
    `Land acquisition cost of ${formatCurrency(costs.land.purchasePrice)}`,
    `Construction costs of $${formatNumber(costs.construction.ratePerSqm)} per sqm (${metadata.constructionQuality} quality)`,
    `Development timeline of ${metadata.timelineMonths} months`,
    `Debt financing at ${formatPercent(metadata.interestRate)} interest rate, ${formatPercent(metadata.debtRatio, 0)} LVR`,
    'Sales prices based on Perth metropolitan market comparable sales data',
    'All costs are GST exclusive',
    'Margin scheme applies for GST on land component',
  ];

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  assumptions.forEach((a, i) => {
    y = addText(doc, y, `${i + 1}. ${a}`);
  });
  y += 3;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.medium);
  y = addText(doc, y, 'DISCLAIMER');
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'This feasibility report is prepared for preliminary assessment purposes only. It should not be relied upon as a substitute for detailed due diligence, professional advice, or formal valuations. All figures are estimates based on current market conditions and publicly available information. Actual costs and revenues may vary significantly. Independent professional advice should be sought before making any investment decisions.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, 180);
  doc.text(disclaimerLines, 14, y);
  y += disclaimerLines.length * 3.5;
  y += 5;

  // Report footer
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.3);
  doc.line(14, y, 196, y);
  y += 5;
  if (companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(`Report prepared by: ${companyName}`, 14, y);
    y += 4;
  }
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text(`Date: ${dateStr}`, 14, y);
  doc.text('Version: 1.0', 100, y);

  // Generate filename
  const filename = `Feasibility_Report_${(formData.suburb || 'Property').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // In browser, save directly; on server, return doc + filename for caller to handle
  if (typeof window !== 'undefined') {
    doc.save(filename);
  }

  return { doc, filename };
}
