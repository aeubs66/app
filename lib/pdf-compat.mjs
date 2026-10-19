// PDF.js still uses this method in its compatibility build. Install it in both
// the page and worker, since each has its own JavaScript environment.
export function installPDFCompatibility() {
  // Safari versions without stream iteration still provide getReader(). PDF.js
  // uses for-await on text and decompression streams in the page and worker.
  if (typeof ReadableStream !== "undefined" &&
      typeof ReadableStream.prototype[Symbol.asyncIterator] !== "function") {
    Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, {
      configurable: true,
      writable: true,
      value: async function* () {
        const reader = this.getReader();
        let finished = false;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) { finished = true; return; }
            yield value;
          }
        } finally {
          try { if (!finished) await reader.cancel(); }
          finally { reader.releaseLock(); }
        }
      },
    });
  }
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
