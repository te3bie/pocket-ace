import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
const base = process.env.POCKETACE_BASE_PATH ?? "/pocket-ace";
if (base && !/^\/[A-Za-z0-9._-]+$/.test(base))
  throw new Error(
    "Pages base path must be empty or a single /repository-name.",
  );
const result = spawnSync(
  process.execPath,
  ["node_modules/expo/bin/cli", "export", "--platform", "web"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      POCKETACE_BASE_PATH: base,
      EXPO_PUBLIC_SUPABASE_URL: "",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
await writeFile("dist/.nojekyll", "");
// Directory indexes support refreshes on GitHub Pages without custom rewrites.
for (const file of await readdir("dist")) {
  if (
    !file.endsWith(".html") ||
    file === "index.html" ||
    file === "404.html" ||
    file.startsWith("+")
  )
    continue;
  const route = file.slice(0, -5);
  await mkdir(`dist/${route}`, { recursive: true });
  await copyFile(`dist/${file}`, `dist/${route}/index.html`);
}
console.log(
  `Pages demo ready at ${base || "/"} (live service configuration excluded).`,
);
