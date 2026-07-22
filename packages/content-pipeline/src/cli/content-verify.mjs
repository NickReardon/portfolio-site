import { relative } from "node:path";
import { platformRoot } from "../common.mjs";
import {
  loadPublicationRecords,
  publicationDrift,
  resolvePublicationTarget,
} from "../publication-store.mjs";

const records = loadPublicationRecords();
if (records.length === 0) {
  throw new Error(
    "No canonical publication sources are available. Run knowledge:preview.",
  );
}
const drift = records.flatMap((record) => {
  const state = publicationDrift(record);
  return state
    ? [{ record, state, target: resolvePublicationTarget(record) }]
    : [];
});
if (drift.length > 0) {
  console.error(
    "Public content differs from its canonical personal-content source:",
  );
  drift.forEach(({ record, state, target }) =>
    console.error(
      `- ${record.id}: ${relative(platformRoot, target)} is ${state}`,
    ),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${records.length} public artifact(s) against canonical sources.`,
  );
}
