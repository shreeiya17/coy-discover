"use client";

import { motion } from "framer-motion";
import type { Profile } from "@/lib/swipe";
import Avatar from "./Avatar";

export default function MatchOverlay({
  profile,
  onKeepSwiping,
  onViewMatches,
}: {
  profile: Profile;
  onKeepSwiping: () => void;
  onViewMatches: () => void;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="It's a match"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center text-neutral-900 shadow-2xl"
        initial={{ scale: 0.6, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <div className="text-5xl">💘</div>
        <h2 className="mt-3 text-3xl font-black">It&apos;s a match!</h2>
        <p className="mt-1 text-neutral-600">You and {profile.name} added each other.</p>
        <Avatar name={profile.name} src={profile.photo} className="mx-auto mt-5 h-28 w-28 rounded-full border-4 border-[#ec4d84] text-4xl" />
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={onViewMatches} className="rounded-full bg-[#ec4d84] px-6 py-3 font-bold text-white active:scale-95">
            View matches
          </button>
          <button onClick={onKeepSwiping} className="rounded-full border border-neutral-300 px-6 py-3 font-semibold active:scale-95">
            Keep swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
