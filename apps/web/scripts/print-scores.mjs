import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, "..", "reports");

if (!fs.existsSync(reportsDir)) {
  console.error("Reports directory does not exist.");
  process.exit(1);
}

const files = fs
  .readdirSync(reportsDir)
  .filter((f) => f.startsWith("lighthouse-") && f.endsWith(".html"));

console.log("| Page | Performance | Accessibility | Best Practices | SEO |");
console.log("| --- | --- | --- | --- | --- |");

for (const file of files) {
  const filePath = path.join(reportsDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  const match = content.match(/window\.__LIGHTHOUSE_JSON__\s*=\s*({.*?});/s);
  if (!match) {
    console.log(`| ${file} | Could not parse JSON | | | |`);
    continue;
  }

  try {
    const report = JSON.parse(match[1]);
    const name = file.replace("lighthouse-", "").replace(".html", "");
    const perf = report.categories.performance
      ? Math.round(report.categories.performance.score * 100)
      : "N/A";
    const a11y = report.categories.accessibility
      ? Math.round(report.categories.accessibility.score * 100)
      : "N/A";
    const bp = report.categories["best-practices"]
      ? Math.round(report.categories["best-practices"].score * 100)
      : "N/A";
    const seo = report.categories.seo
      ? Math.round(report.categories.seo.score * 100)
      : "N/A";

    console.log(`| ${name} | ${perf} | ${a11y} | ${bp} | ${seo} |`);
  } catch (err) {
    console.log(`| ${file} | Error parsing: ${err.message} | | | |`);
  }
}
