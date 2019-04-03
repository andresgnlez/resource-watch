/**
 * Stub the fetch function with the argument as
 * the result
 * @param {any} res Result of the fetch
 */
export const resolveFetch = res => Promise.resolve({
  json: () => res,
  ok: true
});
