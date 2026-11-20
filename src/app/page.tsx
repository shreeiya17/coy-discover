"use client";

import { useState } from "react";
import Discover from "@/components/Discover";

type Tab = "home" | "discover";

const icons: Record<Tab, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  discover: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z",
};

export default function Page() {
  const [tab, setTab] = useState<Tab>("discover");

  return (
    <div className="bg-neutral-100 text-neutral-900">
      <div className="mx-auto flex h-dvh w-full max-w-md flex-col bg-white shadow-sm">
        <main className="min-h-0 flex-1">{tab === "discover" ? <Discover /> : null}</main>
        <nav className="flex border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]">
          {(["home", "discover"] as const).map((t) => (
            <button
              key={t}
              aria-current={tab === t ? "page" : undefined}
              onClick={() => setTab(t)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold capitalize ${
                tab === t ? "text-[#ec4d84]" : "text-neutral-400"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={tab === t ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d={icons[t]} />
              </svg>
              {t}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}