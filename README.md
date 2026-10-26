# Impulso

Plataforma de marketing que **gera o post com IA** (imagem + legenda), usando as
**cores da sua marca**, e agenda/publica no Instagram e Facebook. Dois modos:
fácil (um clique) e pro (controle de tom, formato e variações).

## Como a IA funciona aqui — grátis, sem chave

- **Imagem**: gerada pelo [Pollinations](https://pollinations.ai) (serviço gratuito,
  sem API key). A rota `/api/generate-image` monta um comando a partir da sua ideia +
  objetivo + **paleta da marca** e devolve a URL da imagem gerada.
- **Legenda**: idem, via `text.pollinations.ai`, com **fallback por template** se o
  serviço estiver fora/limitado — então sempre sai uma legenda.
- Pollinations é comunitário: tem **limite de uso e pode ficar lento**. O adaptador
  em `lib/ai/*` é trocável por um provedor pago (OpenAI, HF, Groq…) sem mexer no app.

## Kit de marca (cores da empresa)

Você envia **uma imagem de referência** da empresa. O navegador extrai a **paleta de
cores** dela (`lib/colors.ts`, por análise de cor — sem IA, sem custo) e manda só os
códigos de cor para a geração. A imagem de referência **nunca** é enviada nem copiada;
a IA recebe apenas as cores e recria uma arte original no visual da marca.

> Honestidade técnica: modelos de imagem **seguem** as cores do comando de forma
> **aproximada** — o resultado fica fiel ao visual da marca, não pixel-exato.

## Publicar de verdade no Instagram/Facebook

Via Graph API da Meta. Exige **conta Instagram Profissional ligada a uma Página do
Facebook** e **aprovação do app pela Meta** (gratuito, mas é um processo de dias).
As variáveis `META_*` ficam no `.env.local`. É exigência da Meta, não da ferramenta.

## Rodar

```bash
npm install
cp .env.example .env.local   # tudo opcional — funciona sem nenhuma chave
npm run dev                  # http://localhost:3000
```

> A geração ao vivo só funciona onde a rede alcança a internet aberta (sua máquina/
> servidor). Em ambiente de rede fechada, a legenda cai no template e a imagem não carrega.

## Testes

```bash
npm test   # extração de paleta + montagem dos comandos de imagem/legenda
```

## Estrutura

- `lib/colors.ts` — extração da paleta da marca (testado)
- `lib/ai/image.ts` — comando de imagem + Pollinations (testado)
- `lib/ai/caption.ts` — legenda via IA + fallback template (testado)
- `app/api/generate-image` · `app/api/generate-caption` — rotas do servidor
- `app/page.tsx` — UI: kit de marca, geração, prévia, agenda

## Aviso

Serviços de terceiros (Pollinations, Meta) têm seus próprios termos e limites. Para um
produto em produção, avalie um provedor de IA com SLA e conclua a revisão da Meta.
