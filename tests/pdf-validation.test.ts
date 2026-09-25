import { expect, it } from "vitest";
import { MAX_PDF_BYTES, validateLocalPdf } from "@/features/assessments/pdf-validation";

it("aceita somente PDF com cabeçalho e tamanho dentro do limite", async () => {
  expect(await validateLocalPdf(new File(["%PDF-1.4\nexample"], "prova.pdf", { type: "application/pdf" }))).toBeNull();
  expect(await validateLocalPdf(new File(["%PDF-1.4\nexample"], "prova.PDF"))).toBeNull();
  expect(await validateLocalPdf(new File(["HTML pretending to be a PDF"], "prova.pdf", { type: "application/pdf" }))).toContain("cabeçalho");
  expect(await validateLocalPdf(new File(["%PDF-1.4"], "prova.txt"))).toContain("Selecione");
  expect(await validateLocalPdf(new File([], "prova.pdf"))).toContain("conteúdo");
  expect(await validateLocalPdf(new File([new Uint8Array(MAX_PDF_BYTES + 1)], "prova.pdf"))).toContain("20 MB");
});
