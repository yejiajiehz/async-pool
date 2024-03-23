import { describe, test, expect, vi, beforeEach } from "vitest";
import { asyncPool } from "./async-pool.ts";

function sleep(wait = 250) {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve("");
    }, wait);
  });
}

function randomSleep(max = 200) {
  return sleep(Math.random() * max);
}

describe('asyncPool', () => {
  const len = 100;
  const arr = Array(len)
  .fill(0)
  .map((v, i) => i);

  const limit = 6;

  const cbResolve = vi.fn(async (v: number) => {
      await randomSleep();
      return v;
  });

  const cbReject = vi.fn(async (v: number) => {
      await randomSleep();
      throw new Error(v.toString());
  });

  const cbSync = vi.fn();

  beforeEach(() => {
      cbResolve.mockClear();
      cbReject.mockClear();
      cbSync.mockClear();
  });

  test('Should Run all iterator items', async () => {
      await asyncPool(limit, arr, (i) => cbResolve(i));

      expect(cbResolve).toHaveBeenCalledTimes(len);
      arr.forEach((v) => {
          expect(cbResolve).toHaveBeenCalledWith(v);
      });
  });

  test('Should Run all iterator items with rejected', async () => {
      const result = await asyncPool(limit, arr, (v) =>
          v % 2 === 0 ? cbResolve(v) : cbReject(v),
      );

      expect(cbResolve).toHaveBeenCalledTimes(len / 2);
      expect(cbReject).toHaveBeenCalledTimes(len / 2);

      arr.forEach((v, index) => {
          const isFulfilled = v % 2 === 0;

          const fn = isFulfilled ? cbResolve : cbReject;
          expect(fn).toHaveBeenCalledWith(v);

          const r = result[index];
          expect(r.status).toEqual(isFulfilled ? 'fulfilled' : 'rejected');
      });
  });

  test('Should Run all iterator items with sync function', async () => {
      await asyncPool(limit, arr, (v) => (v % 2 === 0 ? cbResolve(v) : cbSync(v)));

      expect(cbResolve).toHaveBeenCalledTimes(len / 2);
      expect(cbSync).toHaveBeenCalledTimes(len / 2);

      arr.forEach((v) => {
          v % 2 === 0
              ? expect(cbResolve).toHaveBeenCalledWith(v)
              : expect(cbSync).toHaveBeenCalledWith(v);
      });
  });

  test('The max number at runtime should equal limit', async () => {
      let running = 0;
      let maxRunning = 0;
      await asyncPool(limit, arr, async (v) => {
          running++;
          await cbResolve(v);
          maxRunning = Math.max(running, maxRunning);
          running--;
      });
      expect(maxRunning).toEqual(limit);
  });

  test('The number at runtime should to be increase first and then decrease', async () => {
      let running = 0;
      const cbArr: number[] = [];
      await asyncPool(limit, arr, async () => {
          running++;
          cbArr.push(running);
          await randomSleep();
          running--;
      });

      // cbArr are similar to 12345[666...]
      const minCallTimes = len - (limit - 1);
      expect(cbArr.filter((v) => v === limit).length).toBeGreaterThanOrEqual(minCallTimes);

      // check the growth direction
      cbArr.reduce((prev, curr) => {
          expect(curr).toBeGreaterThanOrEqual(prev);
          return curr;
      });
  });
});
