export function safeJSON(o: unknown) {
  const seen = new WeakSet();
  const stringified = JSON.stringify(o, (_, v) => {
    if (v !== null && typeof v === 'object') {
      if (seen.has(v)) return;
      seen.add(v);
    }
    return v;
  });

  return JSON.parse(stringified);
}