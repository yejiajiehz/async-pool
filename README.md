# Async-pool

Run multiple async functions with limited

```typescript
const limit = 3;
const arr = [0, 1, 2, 3];
const fn = (n: number) => n === 0 ? Promise.resolve(n) : Promise.reject(n));

const result = await asyncPool(limit, arr, fn);
/**
 * {
 *   { status: 'fulfilled', value: 0 },
 *   { status: 'rejected', reason: 1 },
 *   { status: 'fulfilled', value: 2 },
 *   { status: 'rejected', reason: 3 },
 * }
 * */
```
