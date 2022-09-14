import type { MainOptions } from "./types.ts";
import { getFilePath, getMimeType } from "./deps.ts";
import { default as getBytes } from "./bundle.js";

export const serveBundledApp: MainOptions["app"] = async (c, next) => {
  let url = new URL(c.req.url);

  let path = getFilePath({
    root: "dist",
    filename: url.pathname,
  });

  let bytes = null;
  bytes = getBytes(path);

  if (bytes) {
    let decoder = new TextDecoder();
    const content = decoder.decode(bytes);
    const mimeType = getMimeType(path);
    if (mimeType) {
      c.header("Content-Type", mimeType);
    }
    // Return Response object
    return c.body(content);
  } else {
    await next();
  }
};
