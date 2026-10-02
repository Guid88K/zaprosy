"use client";

import { useRef, useState } from "react";
import type { NoModeId } from "@/lib/screens";
import type { Template } from "@/lib/templates";

type Props = {
  template: Template;
  yesLabel: string;
  noLabel: string;
  noMode: NoModeId;
  onYes: () => void;
  onNo: () => void;
  compact?: boolean;
};

const dodgePhrases = ["Точно ні?", "Подумай ще", "Ну ні ж", "Не вийде 😏", "Спробуй ще раз", "Я швидша", "Тисни «Так»", "Здавайся 💛"];
const multiplyPhrases = ["Ще раз?", "Ой, ще одна", "Їх стає більше", "Так, так, так", "Опір марний 😄", "Здавайся 💛"];

export function YesNoButtons({ template: t, yesLabel, noLabel, noMode, onYes, onNo, compact }: Props) {
  const [attempts, setAttempts] = useState(0);
  const [dodge, setDodge] = useState({ x: 0, y: 0 });
  const areaRef = useRef<HTMLDivElement>(null);

  const runaway = noMode === "runaway";
  const shrink = noMode === "shrink";
  const multiply = noMode === "multiply";
  const tricky = noMode !== "allow";

  function bump() {
    setAttempts((n) => n + 1);
  }

  function runAway() {
    const width = areaRef.current?.offsetWidth ?? 300;
    const range = Math.min(width * 0.45, 220);
    setDodge({ x: (Math.random() * 2 - 1) * range, y: (Math.random() * 2 - 1) * 90 });
    bump();
  }

  const yesScale = tricky && !multiply ? Math.min(1 + attempts * 0.06, 1.45) : 1;
  const noScale = runaway ? Math.max(1 - attempts * 0.07, 0.55) : shrink ? Math.max(1 - attempts * 0.2, 0) : 1;
  const noGone = shrink && attempts >= 5;
  const yesCount = multiply ? Math.min(1 + attempts, 12) : 1;

  const label = (() => {
    if (!tricky || attempts === 0) return noLabel;
    const list = multiply ? multiplyPhrases : dodgePhrases;
    return list[Math.min(attempts - 1, list.length - 1)];
  })();

  const yesStyle = {
    background: t.accent,
    color: t.accentText,
    transform: `scale(${yesScale})`,
    transformOrigin: "left center",
    zIndex: runaway ? 1 : 2,
  } as const;

  const yesClass = `rounded-xl ${compact ? "py-2.5 text-sm" : "py-3.5 text-base"} font-semibold shadow-sm transition hover:-translate-y-0.5`;

  const noHandlers = runaway
    ? { onMouseEnter: runAway, onTouchStart: runAway, onFocus: runAway, onClick: runAway }
    : shrink
      ? { onClick: bump, onMouseEnter: bump }
      : multiply
        ? { onClick: bump }
        : { onClick: onNo };

  return (
    <div className="font-sans">
      <div ref={areaRef} className={`relative ${multiply ? "flex flex-wrap justify-center gap-3" : "grid grid-cols-2 gap-3"}`}>
        {Array.from({ length: yesCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={onYes}
            className={`${yesClass} ${multiply ? "px-5" : ""} ${multiply && i > 0 ? "animate-pop" : ""}`}
            style={yesStyle}
          >
            {yesLabel}
          </button>
        ))}
        {noGone ? null : (
          <button
            type="button"
            aria-disabled={tricky}
            {...noHandlers}
            className={`rounded-xl border ${compact ? "py-2.5 text-sm" : "py-3.5 text-base"} font-semibold transition duration-200 hover:-translate-y-0.5 ${multiply ? "px-5" : ""}`}
            style={{
              borderColor: t.border,
              color: t.muted,
              background: runaway ? t.card : undefined,
              transform: `translate(${dodge.x}px, ${dodge.y}px) scale(${noScale})`,
              transitionProperty: "transform, opacity",
              zIndex: runaway ? 3 : 1,
            }}
          >
            {label}
          </button>
        )}
      </div>
      {tricky && attempts >= 3 ? (
        <p className="animate-float-in mt-4 text-center text-sm" style={{ color: t.muted }}>
          {noGone ? "Кнопка «ні» самоліквідувалась 😄" : "Здається, варіанту «ні» тут не передбачено 😄"}
        </p>
      ) : null}
    </div>
  );
}
