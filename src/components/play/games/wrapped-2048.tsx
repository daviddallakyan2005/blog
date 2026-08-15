"use client";

import { Game2048 } from "react-2048";

export function Wrapped2048() {
  return (
    <div className="admin-play-2048 flex justify-center py-2">
      <Game2048 size="md" />
    </div>
  );
}
