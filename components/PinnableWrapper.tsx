"use client";

import { useState, ReactNode } from "react";

interface PinnableWrapperProps {
  children: ReactNode;
  onPin: () => void;
}

export function PinnableWrapper({ children, onPin }: PinnableWrapperProps) {
  const [pinned, setPinned] = useState(false);

  return (
    <div className="group relative">
      {children}
      <button
        onClick={() => {
          if (!pinned) {
            onPin();
            setPinned(true);
          }
        }}
        disabled={pinned}
        className={`absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-all ${
          pinned
            ? "bg-blue-50 text-blue-600 cursor-default"
            : "bg-white/90 text-gray-500 opacity-0 backdrop-blur-sm hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
        }`}
        title={pinned ? "Pinned to dashboard" : "Pin to dashboard"}
      >
        <svg
          className="h-3.5 w-3.5"
          fill={pinned ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9"
          />
        </svg>
        {pinned ? "Pinned" : "Pin"}
      </button>
    </div>
  );
}
