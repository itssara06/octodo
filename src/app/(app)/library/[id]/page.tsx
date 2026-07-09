import { getDocumentById } from "@/app/actions/documents";
import { notFound } from "next/navigation";
import { PDFAnnotatorWrapper } from "@/components/PDFAnnotatorWrapper";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const document = await getDocumentById(id);
    return <PDFAnnotatorWrapper document={document} />;
  } catch (error) {
    notFound();
  }
}
