import { basename } from "https://deno.land/std@0.130.0/path/mod.ts";
import { join } from "https://deno.land/std@0.130.0/path/mod.ts";

if (!Deno.args.length) {
  console.log("$ denobundle dir");
  Deno.exit(1);
}

const fi = await Deno.stat(Deno.args[0]);
// deno-lint-ignore no-explicit-any
const m: Record<string, any> = {};
if (fi.isFile) {
  console.log("$ denobundle dir");
  Deno.exit(1);
}
const readdir = async (k: string, v: string) => {
  for await (const d of Deno.readDir(v)) {
    if (d.isFile) {
      m[k + "/" + d.name] = join(v, d.name);
      continue;
    }
    await readdir(k + "/" + d.name, join(v, d.name));
  }
};

await readdir(Deno.args[0], Deno.args[0]);

const f = await Deno.create(Deno.args.length > 1 ? Deno.args[1] : "bundle.js");
await f.write(new TextEncoder().encode(`var m = {};\n`));
const l = Object.keys(m);
for (let i = 0; i < l.length; i++) {
  const k = l[i].replace(Deno.args[0], basename(Deno.args[0]));
  console.log(k);
  await f.write(new TextEncoder().encode(`m["${k}"] = new Uint8Array([`));
  const b = await Deno.readFile(m[l[i]]);
  for (let j = 0; j < b.length; j++) {
    await f.write(new TextEncoder().encode(`${b[j]},`));
  }
  await f.write(new TextEncoder().encode(`]);\n`));
}
await f.write(
  new TextEncoder().encode(`export default function(k){return m[k];}\n`),
);
f.close();
