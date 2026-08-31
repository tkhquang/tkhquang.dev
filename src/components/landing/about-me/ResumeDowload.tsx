"use client";

const RESUME = {
  fileName: "Quang Trinh Khac - Resume.pdf",
  path: "https://tkhquang.dev/assets/resources/pdf/Quang_Trinh_Khac-Resume.pdf",
};

const ResumeDownload = () => {
  const handleResumeDownload = () => {
    try {
      if (typeof window !== "undefined") {
        window.gtag?.("event", "download_resume", {
          event_category: "engagement",
          event_label: RESUME.fileName,
          value: 1,
        });
      }
    } catch (e) {
      console.warn("Error tracking resume download:", e);
    }
  };

  return (
    <a
      className="download-container bg-theme-raised border-theme-hairline-soft hover:border-theme-primary/40 flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
      target="_blank"
      rel="noopener noreferrer"
      title="View Resume"
      href={RESUME.path}
      onClick={handleResumeDownload}
    >
      <span className="download__link shrink-0 shadow-md">
        <span>Download</span>
        <span>PDF</span>
      </span>
      <span className="font-semibold">
        View my resume <span aria-hidden="true">📄</span>
      </span>
    </a>
  );
};

export default ResumeDownload;
