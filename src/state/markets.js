import { createContext, useContext } from 'react';

export const MarketsContext = createContext(null);

export function useMarkets() {
  return useContext(MarketsContext);
}
