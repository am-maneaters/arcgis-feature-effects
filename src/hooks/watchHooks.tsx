import * as watchUtils from '@arcgis/core/core/watchUtils';
import { useEffect, useState } from 'react';

export function useWatchEffect<T extends __esri.Accessor>(
  obj: T,
  property: keyof T,
  callback: (value: any) => void
) {
  useEffect(() => {
    const watch = watchUtils.watch(obj, property as string, callback);
    return () => watch.remove();
  }, [callback, obj, property]);
}

export function useWatchState<T extends __esri.Accessor, TT extends keyof T>(
  obj: T,
  property: TT
): T[TT] {
  const [watchedVal, setWatchedVal] = useState(obj[property]);

  useEffect(() => {
    const watch = watchUtils.watch(obj, property as string, (val: T[TT]) => {
      setWatchedVal(val);
    });
    return () => watch.remove();
  }, [obj, property]);

  return watchedVal;
}
