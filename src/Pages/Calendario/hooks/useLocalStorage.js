import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useLocalStorage(key, initialValue)
 * - SSR-safe (não quebra sem window)
 * - Não guarda "storedValue" como dependência (evita recriar callbacks sempre)
 * - Usa ref para ler valor atual com segurança
 * - Remove/clear suportado
 */
export function useLocalStorage(key, initialValue) {
  const isBrowser = typeof window !== "undefined";

  const readValue = useCallback(() => {
    if (!isBrowser) return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue, isBrowser]);

  const [storedValue, setStoredValue] = useState(() => readValue());

  // ref para sempre ter o valor atual sem depender em callback
  const valueRef = useRef(storedValue);
  useEffect(() => {
    valueRef.current = storedValue;
  }, [storedValue]);

  // se mudar a key, recarrega
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const setValue = useCallback(
    (value) => {
      const prev = valueRef.current;
      const nextValue = typeof value === "function" ? value(prev) : value;

      setStoredValue(nextValue);

      if (!isBrowser) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      } catch {
        // não quebra se storage estiver bloqueado/cheio
      }
    },
    [key, isBrowser]
  );

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);

    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }, [key, initialValue, isBrowser]);

  return [storedValue, setValue, removeValue];
}
