import logo from "@/assets/uop-logo.png";
import { fmtTime, formatHours, hoursDecimal } from "./usage";

const DEPT = "Department of Information Technology";
const FAC = "Faculty of Arts, University of Peradeniya";
const GOLD: [number, number, number] = [214, 162, 30];
const DARK: [number, number, number] = [40, 36, 30];

let logoData: string | null = null;
async function getLogo() {
  if (logoData) return logoData;
  const blob = await (await fetch(logo)).blob();
  logoData = await new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(blob);
  });
  return logoData;
}

async function makeDoc(title: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const img = await getLogo();
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, 210, 4, "F");
  doc.addImage(img, "PNG", 14, 10, 22, 22);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNIVERSITY OF PERADENIYA", 40, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(DEPT, 40, 22);
  doc.text(FAC, 40, 27);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(14, 36, 196, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 105, 45, { align: "center" });
  return doc;
}

function signatures(doc: import("jspdf").jsPDF, y: number, right: string) {
  if (y > 250) {
    doc.addPage();
    y = 30;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setDrawColor(120);
  doc.setLineWidth(0.3);
  const blocks: [number, string][] = [
    [14, "Head, Department of Information Technology"],
    [114, right],
  ];
  for (const [x, label] of blocks) {
    doc.line(x, y + 18, x + 82, y + 18);
    doc.text(label, x, y + 23, { maxWidth: 82 });
    doc.text("Name: ____________________________", x, y + 32);
    doc.text("Date: ______________", x, y + 39);
  }
}

function footer(doc: import("jspdf").jsPDF) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()} · UOP Lab Usage Monitoring System`, 14, 290);
    doc.text(`Page ${i} of ${n}`, 196, 290, { align: "right" });
  }
}

export interface RecordForPdf {
  record_no: string;
  usage_date: string;
  activity_type: string;
  purpose: string;
  responsible_name: string;
  responsible_designation: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  expected_start: string | null;
  expected_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  duration_minutes: number | null;
  participants_expected: number | null;
  participants_actual: number | null;
  status: string;
  notes: string | null;
  verified_at: string | null;
  labs: { code: string; name: string; location: string | null } | null;
  departments: { name: string; faculty: string } | null;
}

export async function recordPdf(r: RecordForPdf, action: "download" | "print") {
  const doc = await makeDoc("LABORATORY USAGE RECORD");
  const autoTable = (await import("jspdf-autotable")).default;
  const verified = r.status === "verified";
  autoTable(doc, {
    startY: 52,
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: DARK },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60, fillColor: [253, 248, 225] } },
    styles: { fontSize: 10, textColor: DARK },
    body: [
      ["Record ID", r.record_no],
      ["Laboratory", `${r.labs?.code} — ${r.labs?.name}${r.labs?.location ? ` (${r.labs.location})` : ""}`],
      ["Visiting faculty", r.departments?.faculty ?? ""],
      ["Visiting department", r.departments?.name ?? ""],
      ["Responsible person", `${r.responsible_name}${r.responsible_designation ? `, ${r.responsible_designation}` : ""}`],
      ["Contact", [r.contact_email, r.contact_phone].filter(Boolean).join(" · ") || "—"],
      ["Activity / purpose", `${r.activity_type}: ${r.purpose}`],
      ["Date of use", r.usage_date],
      ["Expected time (as declared)", `${fmtTime(r.expected_start)} – ${fmtTime(r.expected_end)}`],
      ["Actual time (verified)", verified ? `${fmtTime(r.actual_start)} – ${fmtTime(r.actual_end)}` : "NOT VERIFIED"],
      ["Verified duration", verified && r.duration_minutes ? formatHours(r.duration_minutes) : "NOT VERIFIED"],
      ["Participants (expected / actual)", `${r.participants_expected ?? "—"} / ${r.participants_actual ?? "—"}`],
      ["Verification status", r.status.toUpperCase() + (r.verified_at ? ` on ${new Date(r.verified_at).toLocaleString()}` : "")],
      ["Notes", r.notes ?? "—"],
    ],
  });
  // @ts-expect-error lastAutoTable is added by the plugin
  const y = doc.lastAutoTable.finalY + 12;
  signatures(doc, y, "Head, Visiting Department");
  footer(doc);
  output(doc, `${r.record_no}.pdf`, action);
}

export interface MonthlyData {
  monthLabel: string;
  rows: (RecordForPdf & { verified_min: number })[];
  byLab: [string, number, number][];
  byDept: [string, number, number][];
  issues: { lab: string; equipment_ref: string | null; description: string; priority: string; status: string; reported_on: string }[];
  totalMin: number;
  unverified: number;
}

export async function monthlyPdf(m: MonthlyData, action: "download" | "print") {
  const doc = await makeDoc(`MONTHLY LABORATORY USAGE REPORT — ${m.monthLabel.toUpperCase()}`);
  const autoTable = (await import("jspdf-autotable")).default;
  const head = { fillColor: GOLD, textColor: DARK } as const;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Sessions: ${m.rows.length}   ·   Verified hours: ${hoursDecimal(m.totalMin)}   ·   Unverified / incomplete records: ${m.unverified}`,
    14,
    53,
  );
  const last = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(doc, {
    startY: 58,
    headStyles: head,
    styles: { fontSize: 9 },
    head: [["Laboratory", "Sessions", "Verified hours"]],
    body: m.byLab.map(([l, s, min]) => [l, s, hoursDecimal(min)]),
  });
  autoTable(doc, {
    startY: last() + 6,
    headStyles: head,
    styles: { fontSize: 9 },
    head: [["Visiting department", "Sessions", "Verified hours"]],
    body: m.byDept.map(([l, s, min]) => [l, s, hoursDecimal(min)]),
  });
  autoTable(doc, {
    startY: last() + 6,
    headStyles: head,
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    head: [["Record", "Date", "Lab", "Department", "Responsible", "Actual time", "Hours", "Pax", "Status"]],
    body: m.rows.map((r) => [
      r.record_no,
      r.usage_date,
      r.labs?.code ?? "",
      r.departments?.name ?? "",
      r.responsible_name,
      r.status === "verified" ? `${fmtTime(r.actual_start)}–${fmtTime(r.actual_end)}` : "MISSING",
      r.status === "verified" ? hoursDecimal(r.verified_min) : "—",
      r.participants_actual ?? "—",
      r.status.toUpperCase(),
    ]),
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 8 && d.cell.raw !== "VERIFIED") d.cell.styles.textColor = [180, 40, 30];
    },
  });
  autoTable(doc, {
    startY: last() + 6,
    headStyles: head,
    styles: { fontSize: 8 },
    head: [["Lab", "Equipment", "Issue", "Reported", "Priority", "Status"]],
    body: m.issues.length
      ? m.issues.map((i) => [i.lab, i.equipment_ref ?? "—", i.description, i.reported_on, i.priority, i.status])
      : [["—", "—", "No equipment issues reported this month", "", "", ""]],
  });
  signatures(doc, last() + 12, "Head(s) of Visiting Department(s) — as per procedure");
  footer(doc);
  output(doc, `UOP-IT-Lab-Report-${m.monthLabel.replace(/\s/g, "-")}.pdf`, action);
}

function output(doc: import("jspdf").jsPDF, name: string, action: "download" | "print") {
  if (action === "download") doc.save(name);
  else {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  }
}
