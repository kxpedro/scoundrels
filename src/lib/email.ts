import "server-only";

/** Envia e-mail via API do Resend. Sem chave (dev), apenas imprime no terminal. */
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`\n[email:dev] para ${to} — ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`Falha ao enviar e-mail (${res.status}): ${await res.text()}`);
}
