type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

declare global {
  var __kartfreedomRateLimitStore: RateLimitStore | undefined;
}

const store: RateLimitStore = global.__kartfreedomRateLimitStore ?? new Map();
global.__kartfreedomRateLimitStore = store;

function now() {
  return Date.now();
}

function pruneExpiredBuckets(currentTime: number) {
  if (store.size < 1000) return;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= currentTime) {
      store.delete(key);
    }
  }
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const currentTime = now();
  pruneExpiredBuckets(currentTime);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= currentTime) {
    store.set(key, {
      count: 1,
      resetAt: currentTime + options.windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(0, options.max - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  const allowed = existing.count <= options.max;
  return {
    allowed,
    remaining: Math.max(0, options.max - existing.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetAt - currentTime) / 1000),
    ),
  };
}

export function clearRateLimit(key: string) {
  store.delete(key);
}
