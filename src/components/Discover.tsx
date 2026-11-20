"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/swipe";
import Avatar from "./Avatar";
import MatchOverlay from "./MatchOverlay";
import SwipeCard, { type CardHandle } from "./SwipeCard";

type View = "swipe" | "matches";

async function fetchAll() {
    const [f, m] = await Promise.all([
      fetch("/api/feed", { cache: "no-store" }),
      fetch("/api/matches", { cache: "no-store" }),
    ]);
    if (!f.ok || !m.ok) throw new Error("bad response");
    return {
      profiles: (await f.json()).profiles as Profile[],
      matches: (await m.json()).matches as Profile[],
    };
  }

export default function Discover() {
  const [queue, setQueue] = useState<Profile[] | null>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [view, setView] = useState<View>("swipe");
  const [justMatched, setJustMatched] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<CardHandle>(null);

  
  useEffect(() => {
    let alive = true;
    fetchAll()
      .then((d) => {
        if (!alive) return;
        setQueue(d.profiles);
        setMatches(d.matches);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load profiles. Please check that the server is running.");
        setQueue((q) => q ?? []);
      });
    return () => {
      alive = false;
    };
  }, []);



  const swipe = useCallback(async (profile: Profile, direction: "like" | "pass") => {
    setQueue((q) => (q ?? []).filter((p) => p.id !== profile.id));
    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, direction }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setError(null);
      if (data.matched && !data.alreadySwiped) {
        setMatches((m) => [data.profile, ...m]);
        setJustMatched(data.profile);
      }
    } catch {
      setQueue((q) => [profile, ...(q ?? [])]); // put the card back, nothing was saved
      setError("Could not save your swipe. Please try again.");
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (view !== "swipe" || justMatched) return;
      if (e.key === "ArrowRight") cardRef.current?.swipe("like");
      if (e.key === "ArrowLeft") cardRef.current?.swipe("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, justMatched]);

  const resetDemo = async () => {
    setQueue(null);
    try {
      await fetch("/api/reset", { method: "POST" });
      const d = await fetchAll();
      setQueue(d.profiles);
      setMatches(d.matches);
      setError(null);
    } catch {
      setError("Could not reset the demo data. Please try again.");
      setQueue([]);
    }
  };

  const top = queue?.[0];
  const next = queue?.[1];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-5 pb-3 pt-4">
        <h1 className="text-2xl font-black tracking-tight">
          Discover<span className="text-[#ec4d84]">.</span>
        </h1>
        <div className="flex rounded-full bg-neutral-100 p-1 text-sm font-semibold">
          {(["swipe", "matches"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 transition ${view === v ? "bg-white shadow" : "text-neutral-500"}`}
            >
              {v === "swipe" ? "Swipe" : `Matches${matches.length ? ` (${matches.length})` : ""}`}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <p role="alert" className="mx-5 mb-2 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {view === "swipe" && (
        <>
          {queue === null && <p className="grid flex-1 place-items-center text-neutral-500">Loading profiles...</p>}

          {queue && queue.length === 0 && (
            <div className="grid flex-1 place-items-center px-8 text-center">
              <div>
                <div className="text-5xl">🎉</div>
                <h2 className="mt-3 text-xl font-bold">You are all caught up</h2>
                <p className="mt-1 text-neutral-500">There are no more profiles right now. Check your matches or reset the demo.</p>
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={() => setView("matches")} className="rounded-full bg-[#ec4d84] px-5 py-2.5 font-bold text-white active:scale-95">
                    View matches
                  </button>
                  <button onClick={resetDemo} className="rounded-full border border-neutral-300 px-5 py-2.5 font-semibold active:scale-95">
                    Reset demo data
                  </button>
                </div>
              </div>
            </div>
          )}

          {top && (
            <>
              <div className="relative mx-5 min-h-0 flex-1">
                {next && (
                  <div className="absolute inset-0 scale-95 overflow-hidden rounded-3xl opacity-80 shadow-md">
                    <Avatar name={next.name} src={next.photo} className="h-full w-full text-9xl" />
                  </div>
                )}
                <SwipeCard key={top.id} ref={cardRef} profile={top} onSwipe={(dir) => swipe(top, dir)} />
              </div>
              <div className="flex items-center justify-center gap-8 pb-2 pt-5">
                <button
                  aria-label="Pass"
                  onClick={() => cardRef.current?.swipe("pass")}
                  className="grid h-16 w-16 place-items-center rounded-full border border-neutral-200 bg-white text-2xl text-rose-500 shadow-lg transition hover:bg-rose-50 active:scale-90"
                >
                  ✕
                </button>
                <button
                  aria-label="Like"
                  onClick={() => cardRef.current?.swipe("like")}
                  className="grid h-16 w-16 place-items-center rounded-full bg-[#ec4d84] text-2xl text-white shadow-lg transition hover:brightness-110 active:scale-90"
                >
                  ♥
                </button>
              </div>
              <p className="pb-3 text-center text-xs text-neutral-400">Drag the card, use the buttons, or press the arrow keys</p>
            </>
          )}
        </>
      )}

      {view === "matches" && (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {matches.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="text-5xl">🤍</div>
                <h2 className="mt-3 text-xl font-bold">No matches yet</h2>
                <p className="mt-1 text-neutral-500">A match appears only when you both like each other.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-neutral-400">Only mutual matches appear here.</p>
              <ul className="grid grid-cols-2 gap-3">
                {matches.map((m) => (
                  <li key={m.id} className="overflow-hidden rounded-2xl bg-neutral-50 shadow">
                    <Avatar name={m.name} src={m.photo} className="aspect-3/4 w-full text-6xl" />
                    <div className="p-3">
                      <p className="font-bold">
                        {m.name}, {m.age}
                      </p>
                      <p className="text-xs text-neutral-500">{m.location}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {justMatched && (
          <MatchOverlay
            key={justMatched.id}
            profile={justMatched}
            onKeepSwiping={() => setJustMatched(null)}
            onViewMatches={() => {
              setJustMatched(null);
              setView("matches");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}