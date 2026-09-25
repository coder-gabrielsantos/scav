export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export async function validateLocalPdf(file: File): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) return "Selecione um arquivo PDF.";
  if (file.size === 0 || file.size > MAX_PDF_BYTES) return "O PDF deve ter conteúdo e no máximo 20 MB.";
  const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (header !== "%PDF-") return "O arquivo não contém um cabeçalho PDF válido.";
  return null;
}
