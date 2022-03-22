type InputMap<T> = Record<string, Promise<T>>;
type OutputMap<T> = Record<string, T>;

/**
 * Avoid a dependency on the dojo/promises module and provide an implementation of
 * the all(obj) API in terms of native Promise.all
 * @param obj an object with string keys and Promise<T> values
 * @returns a single Promise that resolves to an object with the same keys as
 *          the input and the resolved promise values.  Any reject() from any
 *          of the promises will invoke the reject of the returned promise.
 */
export async function all<T>(obj: InputMap<T>): Promise<OutputMap<T>> {
  const entries = Object.entries(obj);
  const promises = entries.map((entry) => entry[1]);

  function callbackfn(
    target: OutputMap<T>,
    result: T,
    index: number
  ): OutputMap<T> {
    const key = entries[index][0];
    return Object.assign(target, { [key]: result });
  }

  return Promise.all(promises).then((results) =>
    results.reduce(callbackfn, {})
  );
}
