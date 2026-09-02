import fs from "node:fs/promises";

const clientPath = "src/components/client/client-dashboard-parity-tools.tsx";
let client = await fs.readFile(clientPath, "utf8");
const cssMarker = `        @media (max-width: 639px) {\n          [data-cw-client-header="true"] {`;
if (!client.includes(cssMarker)) throw new Error("client mobile CSS marker not found");
client = client.replace(cssMarker, `        @media (max-width: 639px) {\n          [data-cw-client-notifications="true"] > [role="dialog"] {\n            position: fixed !important;\n            inset-inline: 1rem !important;\n            top: 8.75rem !important;\n            width: auto !important;\n            max-width: none !important;\n          }\n\n          [data-cw-client-header="true"] {`);
await fs.writeFile(clientPath, client);

const testPath = "tests/group-11-mobile-e2e-followup.test.mjs";
let test = await fs.readFile(testPath, "utf8");
const testMarker = `  assert.match(client, /aria-expanded=\\{menuOpen\\}/);\n});`;
if (!test.includes(testMarker)) throw new Error("client accessibility test marker not found");
test = test.replace(testMarker, `  assert.match(client, /aria-expanded=\\{menuOpen\\}/);\n  assert.match(client, /\\[data-cw-client-notifications="true"\\] > \\[role="dialog"\\]/);\n  assert.match(client, /inset-inline: 1rem !important/);\n  assert.match(client, /position: fixed !important/);\n});`);
await fs.writeFile(testPath, test);

await fs.rm("scripts/apply-client-notification-boundary-fix.mjs", { force: true });
await fs.rm(".github/workflows/tmp-client-notification-boundary.yml", { force: true });
