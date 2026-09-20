/**
 * Per-session option order.
 *
 * Presentation only. The engine never sees this order — it scores option ids —
 * so shuffling cannot change a result, only protect it from people favouring
 * whatever is listed first.
 *
 * The order is a pure function of `(seed, questionId)`, not of when a question
 * is shown. That is what keeps it stable within a session: Back, re-showing a
 * question after an escalation, or re-rendering all give the same order,
 * because nothing about the order is stored to drift.
 */

/** FNV-1a over the question id, folded with the session seed. */
function hash(seed: number, text: string): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: small, fast, and good enough to deal cards with. */
function generator(state: number): () => number {
  let a = state >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A new array in a seeded Fisher–Yates order. The input is not touched. */
export function seededShuffle<T>(items: readonly T[], seed: number, key: string): T[] {
  const out = [...items];
  const next = generator(hash(seed, key));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}
