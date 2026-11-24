"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "declutter-likes";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return JSON.stringify(readIds());
}

function getServerSnapshot() {
  return "[]";
}

export function useDeclutterLikes() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const likedIds = JSON.parse(snapshot) as string[];
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const isLiked = useCallback(
    (id: string) => likedIds.includes(id),
    [likedIds],
  );

  const toggleLike = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    const current = readIds();
    if (current.includes(trimmed)) {
      writeIds(current.filter((item) => item !== trimmed));
    } else {
      writeIds([...current, trimmed]);
    }
  }, []);

  return {
    likedIds,
    likedSet: new Set(likedIds),
    isLiked,
    toggleLike,
    hydrated,
  };
}
