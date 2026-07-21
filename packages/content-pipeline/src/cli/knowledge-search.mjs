import { parseArgs } from "../common.mjs";
import { searchKnowledge } from "../knowledge-store.mjs";

const args = parseArgs();
const query = args.positionals.join(" ");
const tags = String(args.options.get("tags") ?? "")
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);
const limit = Number(args.options.get("limit") ?? 12);
const results = searchKnowledge(query, tags, limit);
console.log(JSON.stringify(results, null, 2));
