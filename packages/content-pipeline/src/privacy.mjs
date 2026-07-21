import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const forbiddenPathPatterns = [
  /(^|\/)\.local(\/|$)/u,
  /(^|\/)\.env\.local$/u,
  /(^|\/)personal-content(\/|$)/u,
  /\.decrypted\./u,
  /\.private\.pdf$/u,
  /\.resume-draft\.json$/u,
  /\.sops\.yaml$/u,
];

export function inspectRepositoryFiles(platformRoot, paths) {
  const findings = [];
  const ageSecretMarker = ["AGE", "SECRET", "KEY"].join("-") + "-";
  for (const repositoryPath of new Set(paths.map(normalizePath))) {
    for (const pattern of forbiddenPathPatterns) {
      if (pattern.test(repositoryPath)) {
        findings.push(
          `${repositoryPath}: forbidden private or local artifact path`,
        );
        break;
      }
    }
    const absolutePath = resolve(platformRoot, repositoryPath);
    if (
      !existsSync(absolutePath) ||
      statSync(absolutePath).size > 5_000_000 ||
      /\.pdf$/iu.test(repositoryPath)
    )
      continue;
    let contents;
    try {
      contents = readFileSync(absolutePath, "utf8");
    } catch {
      continue;
    }
    if (contents.includes(ageSecretMarker)) {
      findings.push(`${repositoryPath}: contains an age private identity`);
    }
    if (containsLiteralSopsKey(contents)) {
      findings.push(
        `${repositoryPath}: appears to contain a literal SOPS age key`,
      );
    }
  }
  return findings;
}

function containsLiteralSopsKey(contents) {
  return contents.split(/\r?\n/u).some((line) => {
    const match = line.match(/^\s*SOPS_AGE_KEY\s*=\s*(.*?)\s*$/u);
    if (!match) return false;
    const value = match[1].replace(/^["']|["']$/gu, "");
    return value !== "" && !value.startsWith("op://");
  });
}

function normalizePath(path) {
  return path.trim().replaceAll("\\", "/").replace(/^\.\//u, "");
}
