// PDF.js still uses this method in its compatibility build. Install it in both
// the page and worker, since each has its own JavaScript environment.
export function installPDFCompatibility() {
  if (typeof Promise.withResolvers !== "function") {
    Object.defineProperty(Promise, "withResolvers", {
      configurable: true,
      writable: true,
      value: function () {
        let resolve, reject;
        const promise = new this((res, rej) => { resolve = res; reject = rej; });
        return { promise, resolve, reject };
      },
    });
  }
}
