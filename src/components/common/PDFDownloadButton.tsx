"use client";

import clsx from "clsx";
import { useState } from "react";

interface PDFDownloadButtonOptions extends React.ComponentProps<"button"> {
  url: string;
  filename?: string;
  loading?: React.ReactNode;
}

export default function PDFDownloadButton({
  url,
  filename = "document",
  loading = null,
  children,
  className,
  ...props
}: PDFDownloadButtonOptions) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/pdf?url=${url}`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={clsx(isGenerating && "cursor-not-allowed", className)}
      {...props}
    >
      {isGenerating ? loading : children}
    </button>
  );
}
