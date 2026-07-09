"use client";

import { useState } from "react";
import { Search, Plus, FileText, Download, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getCloudinarySignature, createDocumentRecord } from "@/app/actions/documents";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LibraryClient({ initialDocuments }: { initialDocuments: any[] }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const filteredDocs = initialDocuments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const file = formData.get("file") as File;
    const thumbnail = formData.get("thumbnail") as File;

    if (!file || file.size === 0) {
      alert("Please select a PDF file.");
      setLoading(false);
      return;
    }

    try {
      // 1. Get signatures
      const { signature, timestamp, apiKey, cloudName } = await getCloudinarySignature();
      
      // 2. Upload File to Cloudinary
      const fileData = new FormData();
      fileData.append("file", file);
      fileData.append("api_key", apiKey!);
      fileData.append("timestamp", timestamp.toString());
      fileData.append("signature", signature);
      fileData.append("folder", "octodo_documents");
      
      const fileRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: "POST",
        body: fileData
      });
      const fileJson = await fileRes.json();
      
      let thumbnailUrl = null;
      
      // 3. Upload Thumbnail if exists
      if (thumbnail && thumbnail.size > 0) {
        const thumbData = new FormData();
        thumbData.append("file", thumbnail);
        thumbData.append("api_key", apiKey!);
        thumbData.append("timestamp", timestamp.toString());
        thumbData.append("signature", signature);
        thumbData.append("folder", "octodo_documents");
        
        const thumbRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: thumbData
        });
        const thumbJson = await thumbRes.json();
        thumbnailUrl = thumbJson.secure_url;
      }

      // 4. Save to Database
      await createDocumentRecord({
        name,
        fileUrl: fileJson.secure_url,
        thumbnailUrl
      });

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to upload document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground mt-2">Manage and annotate your PDF documents.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New File
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search documents..." 
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="border rounded-xl bg-card text-card-foreground overflow-hidden shadow-sm hover:shadow transition-all group">
            <div className="aspect-[4/3] bg-muted relative flex items-center justify-center border-b">
              {doc.thumbnailUrl ? (
                <img src={doc.thumbnailUrl} alt={doc.name} className="w-full h-full object-cover" />
              ) : (
                <FileText className="h-12 w-12 text-muted-foreground/50" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Link href={`/library/${doc.id}`}>
                  <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full" title="Annotate">
                    <Edit3 className="h-5 w-5" />
                  </Button>
                </Link>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full" title="Download Original">
                    <Download className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold truncate" title={doc.name}>{doc.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No documents found. Click "New File" to upload one.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new PDF document to your library.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">File Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Q3 Financial Report" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">PDF Document</Label>
              <Input id="file" name="file" type="file" accept="application/pdf" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
              <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Uploading..." : "Upload & Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
