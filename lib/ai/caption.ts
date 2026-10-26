// Caption generation adapter. Tries a free text model (Pollinations, no key);
// falls back to a deterministic template so the app always returns something,
// even offline or when the free service is rate-limited.
//
// buildCaptionPrompt() and templateCaption() are pure and unit-tested.

const HASHTAGS: Record<string, string[]> = {
  promo: ["#promoção", "#oferta", "#imperdível", "#desconto"],
  novo: ["#novidade", "#lançamento", "#novo"],
  dia: ["#bomdia", "#rotina", "#inspiração"],
  evento: ["#evento", "#aovivo", "#participe"],
  dica: ["#dica", "#vocêsabia", "#aprenda"],
};

export function buildCaptionPrompt(idea: string, goal: string, tone: string): string {
  const toneTxt = { vendedor: "vendedor e persuasivo", casual: "casual e próximo", profissional: "profissional", divertido: "divertido e leve" }[tone] || "envolvente";
  return (
    `Escreva UMA legenda curta (máx 4 linhas) em português do Brasil para um post de ${goal} ` +
    `no Instagram/Facebook, tom ${toneTxt}, sobre: "${idea}". ` +
    `Inclua 1 chamada para ação e 4 a 6 hashtags relevantes no final. Não use aspas.`
  );
}

export function templateCaption(idea: string, goal: string, tone: string): string {
  const Idea = idea.trim() ? idea.trim()[0].toUpperCase() + idea.trim().slice(1) : "Novidade chegando";
  const cta = { vendedor: "Chama no direct e garanta o seu! 📲", casual: "Passa aqui pra conferir 💜", profissional: "Saiba mais pelo link da bio.", divertido: "Bora? A gente te espera! 🙌" }[tone] || "Saiba mais!";
  const open = { promo: "🔥 Promoção que você não vai querer perder!", novo: "✨ Novidade na área!", dia: "☀️ Começando o dia com você", evento: "🎉 Marca na agenda!", dica: "💡 Dica rápida do dia" }[goal] || "Novidade!";
  const tags = (HASHTAGS[goal] || []).concat(["#instagram", "#negócios"]);
  return `${open}\n\n${Idea}.\n\n${cta}\n\n${tags.join(" ")}`;
}

export interface CaptionResult {
  text: string;
  provider: "pollinations" | "template";
}

export async function generateCaption(
  idea: string,
  goal: string,
  tone: string,
  fetchImpl: typeof fetch = fetch
): Promise<CaptionResult> {
  const prompt = buildCaptionPrompt(idea, goal, tone);
  try {
    const res = await fetchImpl("https://text.pollinations.ai/" + encodeURIComponent(prompt), {
      headers: { Accept: "text/plain" },
    });
    if (res.ok) {
      const txt = (await res.text()).trim();
      if (txt && txt.length > 10 && !/error|rate limit/i.test(txt)) {
        return { text: txt, provider: "pollinations" };
      }
    }
  } catch {
    // fall through to template
  }
  return { text: templateCaption(idea, goal, tone), provider: "template" };
}
