"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

const SetAboveCardContext = createContext<
  ((node: ReactNode) => void) | null
>(null);

export function PageAboveCardProvider({ children }: { children: ReactNode }) {
  const [aboveCard, setAboveCard] = useState<ReactNode>(null);

  return (
    <SetAboveCardContext.Provider value={setAboveCard}>
      {aboveCard ? (
        <div style={{ marginBottom: 16 }}>{aboveCard}</div>
      ) : null}
      {children}
    </SetAboveCardContext.Provider>
  );
}

export function PageAboveCard({ children }: { children: ReactNode }) {
  const setAboveCard = useContext(SetAboveCardContext);

  useLayoutEffect(() => {
    if (!setAboveCard) return;
    setAboveCard(children);
    return () => setAboveCard(null);
  }, [children, setAboveCard]);

  return null;
}
