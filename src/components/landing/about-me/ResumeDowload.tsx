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
    <div className="download-container typography flex-center my-2 flex-col">
      <a
        className="download__link shadow-md"
        target="_blank"
        rel="noopener noreferrer"
        title="View Resume"
        href={RESUME.path}
        onClick={handleResumeDownload}
      >
        <span>Download</span>
        <span>PDF</span>
      </a>
      <a
        target="_blank"
        href={RESUME.path}
        rel="noopener noreferrer"
        title="View Resume"
        onClick={handleResumeDownload}
      >
        {RESUME.fileName}
      </a>
    </div>
  );
};

export default ResumeDownload;
