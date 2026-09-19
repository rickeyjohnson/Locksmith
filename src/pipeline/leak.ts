function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function decodeCandidates(text: string): string[] {
  const out: string[] = [];
  for (const token of text.match(/[A-Za-z0-9+/=]{8,}/g) ?? []) {
    try {
      const b64 = Buffer.from(token, "base64").toString("utf8");
      if (/^[\x20-\x7e]+$/.test(b64)) out.push(b64);
    } catch { /* not base64 */ }
    if (/^[0-9a-fA-F]+$/.test(token) && token.length % 2 === 0) {
      try {
        const hex = Buffer.from(token, "hex").toString("utf8");
        if (/^[\x20-\x7e]+$/.test(hex)) out.push(hex);
      } catch { /* not hex */ }
    }
  }
  return out;
}

export function detectLeak(text: string | null, password: string): boolean {
  if (!text) return false;
  const pw = normalize(password);
  if (!pw) return false;
  const reversed = [...pw].reverse().join("");

  const flat = normalize(text);
  if (flat.includes(pw) || flat.includes(reversed)) return true;

  for (const decoded of decodeCandidates(text)) {
    const d = normalize(decoded);
    if (d.includes(pw) || d.includes(reversed)) return true;
  }

  const acrostic = normalize(
    text.split("\n").map((line) => line.trim()[0] ?? "").join(""),
  );
  if (acrostic.includes(pw)) return true;

  return false;
}
