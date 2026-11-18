import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const hashes = new Set();
function scan(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) scan(p);
    else if (name.endsWith(".html")) {
      const html = fs.readFileSync(p, "utf8");
      for (const match of html.matchAll(
        /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
      )) {
        if (!/\bsrc\s*=/.test(match[1]) && match[2])
          hashes.add(
            "'sha256-" +
              createHash("sha256").update(match[2]).digest("base64") +
              "'",
          );
      }
    }
  }
}
scan("out");
let headers = fs.readFileSync("out/_headers", "utf8");
headers = headers.replace(
  "script-src 'self';",
  "script-src 'self' " + [...hashes].join(" ") + ";",
);
fs.writeFileSync("out/_headers", headers);
console.log("Next.js static CSP hashes:", hashes.size);
