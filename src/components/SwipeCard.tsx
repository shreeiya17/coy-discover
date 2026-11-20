"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useImperativeHandle, useRef, type Ref } from "react";
import type { Profile } from "@/lib/swipe";
import Avatar from "./Avatar";

export type CardHandle = { swipe: (dir: "like" | "pass") => void };

const DISTANCE = 110;
const FLICK_SPEED = 600;
const FLY_TO = 700;

type Props = {
  profile: Profile;
  onSwipe: (dir: "like" | "pass") => void;
  ref?: Ref<CardHandle>;
};

export default function SwipeCard({ profile, onSwipe, ref }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -30], [1, 0]);
  const busy = useRef(false);

  const fling = (dir: "like" | "pass") => {
    if (busy.current) return; // one swipe per card, even on double clicks
    busy.current = true;
    animate(x, dir === "like" ? FLY_TO : -FLY_TO, {
      duration: 0.28,
      ease: "easeIn",
      onComplete: () => onSwipe(dir),
    });
  };

  useImperativeHandle(ref, () => ({ swipe: fling }));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > DISTANCE || (velocity.x > FLICK_SPEED && offset.x > 40)) fling("like");
    else if (offset.x < -DISTANCE || (velocity.x < -FLICK_SPEED && offset.x < -40)) fling("pass");
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab select-none overflow-hidden rounded-3xl bg-neutral-200 shadow-xl active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.96, opacity: 0.85 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Avatar name={profile.name} src={profile.photo} className="pointer-events-none h-full w-full text-9xl" />

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent p-5 pt-28 text-white">
        <h2 className="text-2xl font-bold">
          {profile.name}, {profile.age}
        </h2>
        <p className="text-sm text-white/80">{profile.location}</p>
        <p className="mt-2 text-sm">{profile.bio}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.interests.map((i) => (
            <span key={i} className="rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
              {i}
            </span>
          ))}
        </div>
      </div>

      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-2xl font-extrabold tracking-wider text-emerald-400"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-2xl font-extrabold tracking-wider text-rose-500"
      >
        PASS
      </motion.div>
    </motion.div>
  );
}