import MarkdownParser from "@/lib/MarkdownParser";

declare global {
  var _MarkdownParser: MarkdownParser;
}

if (global._MarkdownParser) {
  console.log("Reusing existing instance");
}

if (!global._MarkdownParser) {
  global._MarkdownParser = new MarkdownParser();
  console.log("Launching new instance");
}

export const _MarkdownParser = global._MarkdownParser;
