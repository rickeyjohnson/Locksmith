export type Verdict = "approve" | "reject" | "invalid";

/**
 * Reads a classifier's one-word verdict.
 *
 * Only the exact approval word approves. An earlier version asked "does the reply
 * contain the rejection word?" and passed everything else, so a confused guard
 * replying "UNKNOWN" silently let the attempt through — the guard looked like it was
 * working while defending nothing. Callers treat "invalid" as a block, which keeps the
 * fail-closed behaviour the guards already apply to errors.
 */
export function readVerdict(
  text: string,
  words: { approve: string; reject: string },
): Verdict {
  const has = (word: string) =>
    new RegExp(`(^|[^A-Za-z])${word}([^A-Za-z]|$)`, "i").test(text);

  const rejected = has(words.reject);
  const approved = has(words.approve);

  if (rejected) return "reject";          // both present → fail closed
  if (approved) return "approve";
  return "invalid";
}
