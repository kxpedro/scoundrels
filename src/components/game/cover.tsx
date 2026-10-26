import Image from "next/image";
import { cn } from "@/lib/cn";

/** Capa do jogo. Sem imagem, mostra o título sobre um bloco de cor derivada do slug. */
export function Cover({
  title,
  slug,
  url,
  className,
  sizes,
  priority,
  titleAt = "bottom",
}: {
  title: string;
  slug: string;
  url: string | null;
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Em cards o rodapé fica com os selos de nota, então o título sobe. */
  titleAt?: "top" | "bottom";
}) {
  const hue = [...slug].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 360, 7);

  return (
    <div
      className={cn("chamfer relative overflow-hidden", className)}
      style={url ? undefined : { backgroundColor: `hsl(${hue} 38% 20%)` }}
    >
      {url ? (
        <Image src={url} alt={title} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span
          className={cn(
            "font-score absolute inset-x-3 text-[15px] leading-tight font-bold text-cyan uppercase",
            titleAt === "top" ? "top-3 pr-3" : "bottom-3",
          )}
        >
          {title}
        </span>
      )}
    </div>
  );
}
