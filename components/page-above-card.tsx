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

const SetCardlessContext = createContext<((value: boolean) => void) | null>(
  null,
);

const CardlessContext = createContext(false);

export function PageAboveCardProvider({ children }: { children: ReactNode }) {
  const [aboveCard, setAboveCard] = useState<ReactNode>(null);
  const [cardless, setCardless] = useState(false);

  return (
    <SetAboveCardContext.Provider value={setAboveCard}>
      <SetCardlessContext.Provider value={setCardless}>
        <CardlessContext.Provider value={cardless}>
          {aboveCard ? (
            <div style={{ marginBottom: 16 }}>{aboveCard}</div>
          ) : null}
          {children}
        </CardlessContext.Provider>
      </SetCardlessContext.Provider>
    </SetAboveCardContext.Provider>
  );
}

export function usePageCardless() {
  return useContext(CardlessContext);
}

/** Renders page content as stacked cards on the page background (no outer shell card). */
export function PageCardless({ children }: { children?: ReactNode }) {
  const setCardless = useContext(SetCardlessContext);

  useLayoutEffect(() => {
    if (!setCardless) return;
    setCardless(true);
    return () => setCardless(false);
  }, [setCardless]);

  return children ? <>{children}</> : null;
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
