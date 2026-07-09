import { getDocuments } from "@/app/actions/documents";
import { LibraryClient } from "@/components/LibraryClient";

export default async function LibraryPage() {
  const documents = await getDocuments();

  return <LibraryClient initialDocuments={documents} />;
}
