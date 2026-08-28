import "@/assets/styles/(resume)/index.css";
/**
 * Static font faces, not `next/font/google`.
 *
 * This route is printed to PDF by Chromium (app/api/pdf/route.ts) and Skia, its
 * PDF backend, refuses to embed a variable typeface: `kVariable_FontFlag` is the
 * first condition in SkPDFFont::FontType, which forces a Type3 fallback where
 * every glyph is drawn as a vector path. That is why the resume PDF used to
 * contain zero /FontFile2 entries and 27 Type3 fonts.
 *
 * `next/font/google` could not avoid it here. It is hardcoded to the css2
 * endpoint (get-google-fonts-url.js), and although pinned weights are encoded
 * into that URL, whether css2 answers with static instances is Google's
 * per-family call: for Inter it served the same variable file (fvar confirmed)
 * for every pinned weight, while Merriweather 400 comes back static in the
 * same pipeline. The `weight` option itself only pins the @font-face
 * descriptor.
 *
 * @fontsource publishes the static per-weight instances under the real family
 * names ("Inter", "Source Code Pro"), which is what --font-sans-inter and
 * --font-mono already reference.
 */
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-400-italic.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/source-code-pro/latin-400.css";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Quang Trinh Khac - Resume",
  description: "Private resume page",
  robots: "noindex, nofollow, noarchive, nosnippet",
  openGraph: {
    title: "Quang Trinh Khac - Resume",
    description: "Private resume page",
    type: "profile",
  },
};

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
