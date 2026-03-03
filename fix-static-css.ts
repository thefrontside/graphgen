#!/usr/bin/env -S deno run -A

/**
 * Post-process staticalized Fresh+Twind site to fix missing CSS
 *
 * Fresh's Twind plugin doesn't properly capture CSS during staticalization
 * because of JIT compilation. This script extracts the full CSS and state
 * from a working page and injects them into all broken pages.
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

const builtDir = "built";

// Find a page with full Twind CSS to use as reference
const referenceFile = `${builtDir}/docs/introduction/index.html`;
const referenceHtml = await Deno.readTextFile(referenceFile);

// Extract just the CSS content from inside the style tag (not the tag itself)
const styleMatch = referenceHtml.match(
  /<style id="__FRSH_TWIND">([\s\S]*?)<\/style>/,
);
if (!styleMatch) {
  console.error("❌ Could not find Twind style tag in reference file");
  Deno.exit(1);
}

const referenceTwindCSS = styleMatch[1];
console.log(`✓ Found Twind CSS content (${referenceTwindCSS.length} chars)`);

// Extract the full Twind state from the reference
const stateMatch = referenceHtml.match(/"v":(\[\[.*?\]\])/);
if (!stateMatch) {
  console.error("❌ Could not find Twind state in reference file");
  Deno.exit(1);
}

const referenceTwindState = stateMatch[1];
console.log(`✓ Found Twind state (${referenceTwindState.length} chars)`);

// Process all HTML files
let fixed = 0;
let skipped = 0;

for await (const entry of walk(builtDir, { exts: [".html"] })) {
  const html = await Deno.readTextFile(entry.path);

  let needsFix = false;
  let fixedHtml = html;

  // Check if this page has empty or minimal Twind state
  if (
    html.includes('{"v":[[],[[]]]}') || !html.match(/"v":\[\[\],\[.{1000,}\]\]/)
  ) {
    // Replace/fix Twind state
    if (html.includes('"v":[[],[]]')) {
      fixedHtml = fixedHtml.replace(
        /"v":\[\[\],\[\[\]\]\]/,
        `"v":${referenceTwindState}`,
      );
    } else {
      fixedHtml = fixedHtml.replace(
        /"v":(\[\[.*?\]\])/,
        `"v":${referenceTwindState}`,
      );
    }
    needsFix = true;
  }

  // Check if style tag has minimal CSS (less than 3KB indicates problem)
  const currentStyleMatch = html.match(
    /<style id="__FRSH_TWIND">([\s\S]*?)<\/style>/,
  );
  if (currentStyleMatch && currentStyleMatch[1].length < 3000) {
    // Replace just the CSS content inside the style tag
    fixedHtml = fixedHtml.replace(
      /(<style id="__FRSH_TWIND">)[\s\S]*?(<\/style>)/,
      `$1${referenceTwindCSS}$2`,
    );
    needsFix = true;
  }

  if (needsFix) {
    console.log(`🔧 Fixing ${entry.path}`);
    await Deno.writeTextFile(entry.path, fixedHtml);
    fixed++;
  } else {
    skipped++;
  }
}

console.log(`\n✅ Fixed ${fixed} pages, ${skipped} pages were already OK`);
