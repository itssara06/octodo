"use client";

import dynamic from "next/dynamic";

export const PDFAnnotatorWrapper = dynamic(() => import("./PDFAnnotator").then(m => m.PDFAnnotator), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading Editor...</div>
});
