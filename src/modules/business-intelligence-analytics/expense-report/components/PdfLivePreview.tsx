"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ExportOptions } from "@/modules/business-intelligence-analytics/expense-report/utils/exportPDF";

type PreviewProps = {
  options: ExportOptions;
};

export default function PdfLivePreview({ options }: PreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    // cleanup previous object URL
    return () => {
      if (lastBlobUrl.current) {
        URL.revokeObjectURL(lastBlobUrl.current);
      }
    };
  }, []);

  const generatePreview = async () => {
    // dynamic import so this runs only in the browser
    const mod = await import("@/modules/business-intelligence-analytics/expense-report/utils/exportPDF");
    // exportToPDF returns void normally, but when preview:true it returns Blob|null
    const blobOrUndefined = (await mod.exportToPDF({ ...options, preview: true })) as
      | Blob
      | null
      | undefined;
    if (!blobOrUndefined) return;
    if (lastBlobUrl.current) URL.revokeObjectURL(lastBlobUrl.current);
    const objectUrl = URL.createObjectURL(blobOrUndefined);
    lastBlobUrl.current = objectUrl;
    setUrl(objectUrl);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={generatePreview} style={{ padding: "8px 12px" }}>
          Generate Preview
        </button>
        <button
          onClick={() => {
            if (url) window.open(url, "_blank");
          }}
          disabled={!url}
          style={{ padding: "8px 12px" }}
        >
          Open in new tab
        </button>
      </div>
      <div style={{ height: 640, border: "1px solid #e5e7eb" }}>
        {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            title="PDF Preview"
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        ) : (
          <div style={{ padding: 16, color: "#6b7280" }}>No preview generated</div>
        )}
      </div>
    </div>
  );
}
