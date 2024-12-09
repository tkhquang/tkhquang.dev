import fs from "fs";
import path from "path";
import { visit } from "unist-util-visit";
import { Node, Root } from "hast";

type ProviderOptions = {
  template?: string;
  [key: string]: any;
};

type Options = {
  enabledProviders?: string[];
} & {
  [key: string]: ProviderOptions;
};

const loadProviders = async (
  options: Options
): Promise<{ [key: string]: any }> => {
  const providers: { [key: string]: any } = {};
  const selectedProviders = (options.enabledProviders || []).filter(
    (provider) => provider !== "Provider"
  );

  for (const providerName of selectedProviders) {
    const providerModule = await import(`./providers/${providerName}`);
    providers[providerName] = providerModule.default || providerModule;
  }

  return providers;
};

export default function remarkEmbed(options: Options) {
  return async function transform(tree: Root): Promise<void> {
    const embedLinks: Node[] = [];

    visit(tree, "paragraph", (node: Node) => {
      embedLinks.push(node);
    });

    const loadedProviders = await loadProviders({
      enabledProviders: options.enabledProviders || [],
    });

    for (const node of embedLinks) {
      let embedData: string | undefined;

      try {
        for (const providerName in loadedProviders) {
          const providerOptions = options[providerName] || {};
          const ProviderClass = loadedProviders[providerName];
          const Provider = new ProviderClass(providerOptions);

          if (providerOptions.template) {
            Provider.setCustomTemplate(providerOptions.template);
          }

          if (Provider.isEmbedLink(node)) {
            const embedLink = Provider.getEmbedLink(node);
            embedData = await Provider.getEmbedData(embedLink);
            break;
          }
        }
      } catch (err) {
        console.error(err);
      }

      if (embedData) {
        (node as any).type = "html"; // Explicitly cast node to `any` for modification
        (node as any).value = embedData;
      }
    }
  };
}
