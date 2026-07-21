import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import MiniSearch from "minisearch";
import { localRoot } from "../common.mjs";
import {
  loadKnowledgeDocuments,
  miniSearchOptions,
  toSearchDocument,
} from "../knowledge-store.mjs";

const documents = loadKnowledgeDocuments();
if (documents.length === 0) {
  throw new Error(
    "No knowledge documents are available to index. Run a successful knowledge:preview first.",
  );
}
const index = new MiniSearch(miniSearchOptions);
index.addAll(documents.map(toSearchDocument));
const indexDirectory = resolve(localRoot, "index");
mkdirSync(indexDirectory, { recursive: true });
writeFileSync(
  resolve(indexDirectory, "knowledge-index.json"),
  JSON.stringify(index),
  "utf8",
);
console.log(`Indexed ${documents.length} knowledge document(s).`);
