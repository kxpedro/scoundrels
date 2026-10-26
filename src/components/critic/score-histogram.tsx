import { cn } from "@/lib/cn";

/** "Como avalia": distribuição das notas do crítico em 10 faixas. Faixas baixas em vermelho/âmbar, altas no amarelo da marca. */
export function ScoreHistogram({ distribution, label }: { distribution: number[]; label: string }) {
  const max = Math.max(1, ...distribution);
  const total = distribution.reduce((a, b) => a + b, 0);

  return (
    <figure>
      <figcaption className="label-mono mb-2 text-[10px] text-muted">{label}</figcaption>
      <div className="flex h-14 items-end gap-1" role="img" aria-label={`${label}: ${distribution.map((n, i) => `${i}–${i + 1}: ${n}`).join(", ")}`}>
        {distribution.map((n, i) => (
          <span
            key={i}
            title={`${i}–${i + 1}: ${n}`}
            className={cn("flex-1", i < 5 ? "bg-red" : i < 7 ? "bg-amber" : "bg-brand", n === 0 && "opacity-20")}
            style={{ height: `${total ? Math.max(6, (n / max) * 100) : 6}%` }}
          />
        ))}
      </div>
      <div className="label-mono mt-1 flex justify-between text-[10px] text-muted">
        <span>0</span>
        <span>10</span>
      </div>
    </figure>
  );
}
