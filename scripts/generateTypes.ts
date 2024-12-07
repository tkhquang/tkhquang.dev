import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";

const CONFIG_FILE = "netlify-cms-config.yml";

// Map CMS widget types to TypeScript types
const widgetTypeMap: { [key: string]: string } = {
  string: "string",
  datetime: "Date",
  boolean: "boolean",
  relation: "string",
  list: "string[]",
  image: "string",
  markdown: "string",
};

// Function to map fields to TypeScript properties
function mapFieldsToTs(fields: any[]): string {
  return fields
    .map((field) => {
      const tsType = widgetTypeMap[field.widget] || "any"; // Default to 'any' if widget type is unknown
      const optional = field.required === false ? "?" : "";
      return `  ${field.name}${optional}: ${tsType};`;
    })
    .join("\n");
}

// Capitalize the first letter of a string
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate TypeScript interfaces
function generateTypescriptInterfaces(config: any): string {
  const interfaces: string[] = [];

  for (const collection of config.collections) {
    const interfaceName = `${capitalize(collection.name)}Collection`;
    const fields = collection.fields || [];
    const tsFields = mapFieldsToTs(fields);
    interfaces.push(`export interface ${interfaceName} {\n${tsFields}\n}`);
  }

  return interfaces.join("\n\n");
}

// Main function
async function main() {
  const yamlFilePath = path.join(__dirname, "..", CONFIG_FILE);
  const yamlContent = await fs.readFile(yamlFilePath, "utf8");
  const config = yaml.parse(yamlContent);

  const tsInterfaces = generateTypescriptInterfaces(config);
  const outputFilePath = path.join(
    __dirname,
    "..",
    "/src/models/generated/markdown.types.ts"
  );

  // Ensure the parent directory exists
  await fs.mkdir(path.dirname(outputFilePath), { recursive: true });

  await fs.writeFile(outputFilePath, tsInterfaces, "utf8");
  console.log(`TypeScript interfaces generated and saved to ${outputFilePath}`);
}

main().catch(console.error);
