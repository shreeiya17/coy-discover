"use client";

import { useState } from "react";

export default function Avatar({ name, src, className = "" }: { name: string; src: string; className?: string }) {
  const [ok, setOk] = useState(true);
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-gradient-to-br from-pink-200 to-violet-200 font-black text-white ${className}`}>
      <span>{name[0]}</span>
      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          draggable={false}
          onError={() => setOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}