import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";

const base = "inline-flex items-center justify-center gap-2 text-[13px] transition-colors disabled:cursor-not-allowed";
const variants: Record<Variant, string> = {
  // Um por tela: é um dos dois elementos com sombra sólida.
  primary: "bg-brand text-on-brand font-score font-bold px-4 py-2 shadow-hard hover:bg-fg",
  secondary:
    "border-[1.5px] border-line-strong text-body px-3.5 py-1.5 hover:border-label aria-pressed:border-cyan aria-pressed:text-cyan",
};

type ButtonProps = React.ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "secondary", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "secondary", className, ...props }: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
