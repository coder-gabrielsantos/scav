// Gera somente o PDF público e fictício usado pela interface demonstrativa.
import { mkdirSync, writeFileSync } from "node:fs";

const lines = [
  "SCAV - AVALIACAO DEMONSTRATIVA",
  "Arquivo ficticio para testar visualizacao e impressao.",
  "Aluno(a): __________________________________________",
  "Turma: ______________  Data: _______________________",
  "1. Explique, com suas palavras, o tema estudado.",
  "___________________________________________________",
  "___________________________________________________",
  "2. Apresente um exemplo e justifique sua resposta.",
  "___________________________________________________",
  "___________________________________________________",
  "Este documento nao e uma avaliacao real da escola.",
];
const stream = `BT /F1 12 Tf 50 790 Td 25 TL ${lines.map((line, index) => `${index ? "T* " : ""}(${line.replace(/[()\\]/g, "\\$&")}) Tj`).join("\n")} ET`;
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
];
let content = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((object, index) => { offsets.push(Buffer.byteLength(content)); content += `${index + 1} 0 obj\n${object}\nendobj\n`; });
const xref = Buffer.byteLength(content);
content += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const directory = new URL("../public/demo/", import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL("avaliacao-exemplo.pdf", directory), content);
