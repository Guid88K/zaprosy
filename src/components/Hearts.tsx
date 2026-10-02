"use client";

const emojis = ["💛", "💖", "💗", "✨", "🧡"];

/** Детермінований псевдовипадковий дріб 0..1, щоб рендер лишався чистим. */
function noise(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Злива сердечок на весь екран. Рендериться лише на час анімації. */
export function Hearts({ count = 28 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, i) => ({
    left: noise(i, 1) * 100,
    delay: noise(i, 2) * 0.9,
    size: 16 + noise(i, 3) * 26,
    duration: 2.2 + noise(i, 4) * 1.6,
    emoji: emojis[i % emojis.length],
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {items.map((h, i) => (
        <span
          key={i}
          className="animate-heart absolute -bottom-10"
          style={{ left: `${h.left}%`, fontSize: h.size, animationDelay: `${h.delay}s`, animationDuration: `${h.duration}s` }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
