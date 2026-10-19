// Best-effort protection for one server process. Multi-instance deployments need a shared rate limiter.
const buckets = new Map<
  string,
  { minute: number; minuteCount: number; day: number; dayCount: number }
>();
export function consumeAILimit(identity: string, now = Date.now()) {
  const minute = Math.floor(now / 60000);
  const day = Math.floor(now / 86400000);
  const keys = ["global", identity];
  for (const key of keys) {
    let bucket = buckets.get(key);
    if (!bucket || bucket.day !== day) {
      bucket = { minute, minuteCount: 0, day, dayCount: 0 };
      buckets.set(key, bucket);
    }
    if (bucket.minute !== minute) {
      bucket.minute = minute;
      bucket.minuteCount = 0;
    }
    if (bucket.dayCount >= (key === "global" ? 100 : 30))
      return {
        allowed: false,
        retryAfter: Math.ceil(((day + 1) * 86400000 - now) / 1000),
      };
    if (bucket.minuteCount >= (key === "global" ? 4 : 3))
      return {
        allowed: false,
        retryAfter: Math.ceil(((minute + 1) * 60000 - now) / 1000),
      };
  }
  for (const key of keys) {
    const bucket = buckets.get(key)!;
    bucket.minuteCount++;
    bucket.dayCount++;
  }
  if (buckets.size > 2000)
    for (const [key, value] of buckets)
      if (value.day !== day) buckets.delete(key);
  return { allowed: true, retryAfter: 0 };
}
