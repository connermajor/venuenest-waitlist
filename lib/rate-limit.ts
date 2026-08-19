// Best-effort in-memory limiter. Serverless instances don't share memory,
// so this throttles bursts per warm instance rather than globally. For a
// hard guarantee you'd back this with Redis (their stack uses BullMQ/Redis).
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length <= limit;
}
