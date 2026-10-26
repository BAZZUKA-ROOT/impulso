"use client";

import { useEffect, useRef, useState } from "react";

const GOALS = [
  { id: "promo", label: "🔥 Promoção" },
  { id: "novo", label: "✨ Novo produto" },
  { id: "dia", label: "☀️ Post do dia" },
  { id: "evento", label: "🎉 Evento" },
  { id: "dica", label: "💡 Dica" },
];

interface Swatch { hex: string; }
interface Post { id: string; idea: string; caption: string; img: string; nets: string[]; status: string; when: string; }

// client-side palette extraction (mirror of lib/colors; kept here so the browser
// can read the uploaded image via canvas without uploading it anywhere)
function extractPalette(pixels: Uint8ClampedArray, count = 5): string[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i + 3 < pixels.length; i += 16) {
    if (pixels[i + 3] < 125) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const c = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    c.r += r; c.g += g; c.b += b; c.n++; buckets.set(key, c);
  }
  let cands = [...buckets.values()]
    .map((c) => ({ rgb: [Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n)] as [number, number, number], n: c.n }))
    .sort((a, b) => b.n - a.n);
  const colorful = cands.filter((c) => Math.max(...c.rgb) - Math.min(...c.rgb) > 18);
  if (colorful.length >= count) cands = colorful;
  const picked: typeof cands = [];
  const d = (a: number[], b: number[]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  for (const c of cands) { if (picked.every((p) => d(p.rgb, c.rgb) > 48)) picked.push(c); if (picked.length >= count) break; }
  for (const c of cands) { if (picked.length >= count) break; if (!picked.includes(c)) picked.push(c); }
  return picked.map((p) => "#" + p.rgb.map((v) => v.toString(16).padStart(2, "0")).join(""));
}

export default function Home() {
  const [tab, setTab] = useState<"criar" | "agenda">("criar");
  const [mode, setMode] = useState<"easy" | "pro">("easy");
  const [goal, setGoal] = useState("promo");
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("vendedor");
  const [fmt, setFmt] = useState("feed");
  const [nets, setNets] = useState<string[]>(["ig", "fb"]);
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ img: string; caption: string; provider: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem("impulso.posts") || "[]"); if (Array.isArray(s)) setPosts(s); } catch {}
    try { const p = JSON.parse(localStorage.getItem("impulso.brand") || "[]"); if (Array.isArray(p)) setPalette(p); } catch {}
  }, []);
  const savePosts = (p: Post[]) => { setPosts(p); try { localStorage.setItem("impulso.posts", JSON.stringify(p)); } catch {} };

  function onBrandFile(f?: File) {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const s = 120; c.width = s; c.height = s;
      const x = c.getContext("2d")!;
      x.drawImage(img, 0, 0, s, s);
      const pal = extractPalette(x.getImageData(0, 0, s, s).data);
      setPalette(pal);
      try { localStorage.setItem("impulso.brand", JSON.stringify(pal)); } catch {}
    };
    img.src = URL.createObjectURL(f);
  }

  function toggleNet(n: string) {
    setNets((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));
  }

  async function generate() {
    if (!idea.trim()) return;
    setLoading(true); setDraft(null);
    try {
      const [imgRes, capRes] = await Promise.all([
        fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, goal, fmt, tone, palette }) }).then((r) => r.json()),
        fetch("/api/generate-caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, goal, tone }) }).then((r) => r.json()),
      ]);
      setDraft({ img: imgRes.url, caption: capRes.text, provider: `${imgRes.provider}/${capRes.provider}` });
    } catch {
      setDraft({ img: "", caption: "Não consegui gerar agora. Verifique a conexão e tente de novo.", provider: "erro" });
    } finally { setLoading(false); }
  }

  function addPost(status: string, when?: string) {
    if (!draft) return;
    const p: Post = { id: "p" + Date.now(), idea, caption: draft.caption, img: draft.img, nets, status, when: when || new Date().toISOString() };
    savePosts([p, ...posts]);
    setDraft(null); setIdea(""); setTab("agenda");
  }

  return (
    <main className="wrap">
      <header>
        <div className="logo"><span>✦</span> Impulso</div>
        <nav>
          <button className={mode === "easy" ? "on" : ""} onClick={() => setMode("easy")}>Fácil</button>
          <button className={mode === "pro" ? "on" : ""} onClick={() => setMode("pro")}>Pro</button>
        </nav>
      </header>

      <nav style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={"chip" + (tab === "criar" ? " on" : "")} onClick={() => setTab("criar")}>Criar</button>
        <button className={"chip" + (tab === "agenda" ? " on" : "")} onClick={() => setTab("agenda")}>Agenda ({posts.length})</button>
      </nav>

      {tab === "criar" && (
        <>
          <div className="card">
            <p className="eyebrow">Kit de marca</p>
            <p className="muted" style={{ marginTop: 0 }}>
              Envie uma imagem da sua empresa. Pegamos só as <b>cores e o visual</b> — a imagem nunca é copiada.
            </p>
            <div className="drop" onClick={() => fileRef.current?.click()}>
              {palette.length ? "Trocar imagem de referência" : "📎 Enviar imagem de referência"}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onBrandFile(e.target.files?.[0])} />
            {palette.length > 0 && (
              <div className="swatches">
                {palette.map((h) => (
                  <div key={h} className="sw" style={{ background: h }}><span>{h}</span></div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <p className="eyebrow">O que divulgar?</p>
            <div className="chips">
              {GOALS.map((g) => (
                <button key={g.id} className={"chip" + (goal === g.id ? " on" : "")} onClick={() => setGoal(g.id)}>{g.label}</button>
              ))}
            </div>
            <label htmlFor="idea">Sua ideia em uma frase</label>
            <input id="idea" type="text" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ex: promoção de pizza na sexta, 2 por 1" />

            {mode === "pro" && (
              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label htmlFor="tone">Tom</label>
                  <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option value="vendedor">Vendedor</option><option value="casual">Casual</option>
                    <option value="profissional">Profissional</option><option value="divertido">Divertido</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fmt">Formato</label>
                  <select id="fmt" value={fmt} onChange={(e) => setFmt(e.target.value)}>
                    <option value="feed">Feed</option><option value="story">Story</option><option value="reels">Reels</option>
                  </select>
                </div>
              </div>
            )}

            <div className="net">
              <button className={nets.includes("ig") ? "on" : ""} onClick={() => toggleNet("ig")}>Instagram</button>
              <button className={nets.includes("fb") ? "on" : ""} onClick={() => toggleNet("fb")}>Facebook</button>
            </div>

            <button className="btn" onClick={generate} disabled={loading}>
              {loading ? <><span className="spin" /> Gerando…</> : "Gerar com IA"}
            </button>
          </div>

          {draft && (
            <div className="card">
              <p className="eyebrow">Prévia</p>
              <div className="post">
                {draft.img ? <img src={draft.img} alt="imagem gerada" /> : null}
                <div className="cap">{draft.caption}</div>
                <div className="flag">✦ gerado por IA ({draft.provider}) · cores da marca aplicadas</div>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn" onClick={() => addPost("publicado")}>Publicar</button>
                <button className="btn ghost" onClick={() => addPost("agendado", new Date(Date.now() + 864e5).toISOString())}>Agendar p/ amanhã</button>
              </div>
            </div>
          )}

          <div className="note">
            Imagem e legenda usam um serviço de IA gratuito (sem chave). A IA segue a paleta da sua marca de forma
            aproximada e cria uma arte original — nunca copia a imagem enviada. Publicação real no Instagram/Facebook
            exige conta profissional e aprovação da Meta.
          </div>
        </>
      )}

      {tab === "agenda" && (
        <>
          <p className="eyebrow">Seus posts</p>
          {posts.length === 0 && <p className="muted">Nada ainda. Crie um post na aba Criar.</p>}
          {posts.map((p) => (
            <div key={p.id} className="sched">
              {p.img ? <img src={p.img} alt="" /> : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.idea}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>
                  {p.status === "publicado" ? "Publicado" : "Agendado"} · {new Date(p.when).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {p.nets.join(" + ")}
                </div>
              </div>
              <button className="chip" onClick={() => savePosts(posts.filter((x) => x.id !== p.id))}>✕</button>
            </div>
          ))}
        </>
      )}
    </main>
  );
}
