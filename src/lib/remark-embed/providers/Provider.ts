import fs from "fs";
import Mustache from "mustache";
import path from "path";

export interface ProviderOptions {
  [key: string]: any; // Additional options
}

class Provider {
  protected regexp: RegExp; // Regular expression to match embed links
  protected idPosition: number; // Position of the ID in the regex match array
  protected template: string | null; // Path to the template
  protected options: ProviderOptions; // Options passed to the provider

  constructor(options: ProviderOptions) {
    this.regexp = /(?:)/; // Default RegExp placeholder
    this.idPosition = 1;
    this.template = null;
    this.options = options;
  }

  isEmbedLink(node: any): boolean {
    return (
      node.children.length === 1 &&
      node.children[0].type === "link" &&
      this.regexp.test(node.children[0].url)
    );
  }

  getEmbedLink(node: any): string {
    return node.children[0].url;
  }

  getEmbedId(url: string): string | false {
    const res = url.match(this.regexp);
    return res ? res[this.idPosition] : false;
  }

  getTemplate(): string {
    if (!this.template) {
      throw new Error("Template is not set.");
    }

    return fs.readFileSync(path.resolve(this.template), "utf8");
  }

  setCustomTemplate(template: string): this {
    this.template = path.resolve(template);
    return this;
  }

  async getEmbedData(embedLink: string): Promise<string> {
    const template = this.getTemplate();

    return Mustache.render(template, {
      embedData: "",
      id: this.getEmbedId(embedLink),
      link: embedLink,
      options: this.options,
    });
  }
}

export default Provider;
