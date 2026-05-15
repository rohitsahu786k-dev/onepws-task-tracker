import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useClickOutside(initialValue = null) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  const reset = useCallback(() => setValue(initialValue), [initialValue]);
  return useMemo(() => ({ value, setValue, reset, ref }), [value, reset]);
}

export default useClickOutside;
