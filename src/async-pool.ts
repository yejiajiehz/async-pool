// Asynchronous function queue, returning a result similar to Promise.allSettled
export async function asyncPool<T, R = any>(
  poolLimit: number,
  iterable: T[],
  iteratorFn: (item: T, array: T[]) => Promise<R> | R,
): Promise<PromiseSettledResult<R>[]> {
  const executing = new Set();

  const result: PromiseSettledResult<R>[] = Array(iterable.length);

  for (const [index, item] of iterable.entries()) {
      const p = Promise.resolve(iteratorFn(item, iterable))
          .then((value) => {
              result[index] = { status: 'fulfilled', value };
          })
          .catch((reason) => {
              result[index] = { status: 'rejected', reason };
          })
          .finally(() => executing.delete(p));

      executing.add(p);

      // after exceeding the limit, wait for the task in the queue to be completed
      if (executing.size >= poolLimit) {
          // waiting for any one in the queue to complete
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
          await Promise.race(executing);
      }
  }

  // waiting for all the queue to complete
  await Promise.all(executing);

  return result;
}
