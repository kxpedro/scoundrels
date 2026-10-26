import { notFound } from "next/navigation";

/** Qualquer rota não mapeada dentro de /[lang] cai no not-found localizado. */
export default function CatchAll() {
  notFound();
}
