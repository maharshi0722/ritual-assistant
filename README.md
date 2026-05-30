# Ritual Assistant - Setup Complete ✓

This is a fully-functional Ritual Chain documentation assistant powered by RAG (Retrieval-Augmented Generation) and streaming LLM responses.

## What's Included

### Backend

- **app/api/chat/route.js** — Next.js API route handling chat requests
  - Proxies to OpenRouter for LLM inference
  - Injects Ritual documentation context via RAG search
  - Supports streaming responses

### Frontend

- **app/page.js** — React chat interface
  - Real-time streaming chat with markdown rendering
  - Sidebar with quick question suggestions
  - Source citations for retrieved documentation
  - Mobile-responsive design

### Documentation (10 markdown files in `public/data/`)

1. **vision.md** — Ritual Chain vision & overview
2. **agents.md** — Autonomous agents & 7 properties
3. **precompiles.md** — Complete precompile reference
4. **scheduler.md** — Scheduler system & scheduling
5. **real-world.md** — HTTP, Long-running tasks, Secrets
6. **enshrined-ai.md** — LLM, FHE, ZK, Multimodal
7. **authentication.md** — Passkeys, Ed25519, DKMS, X402
8. **system-contracts.md** — System contracts & patterns
9. **quick-start.md** — Setup guides & deployment
10. **glossary.md** — Glossary & FAQ

### Styling & Search

- **app/globals.css** — Complete design system with animations
- **lib/search.js** — TF-IDF chunker and semantic search

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env.local` with your OpenRouter API key:

```env
OPENROUTER_API_KEY=sk_...
CHAT_MODEL=anthropic/claude-haiku-4-5
```

### 3. Get OpenRouter API Key

Visit [openrouter.ai](https://openrouter.ai) and create an account to get an API key.

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### 🔍 Retrieval-Augmented Generation (RAG)

- Chunks all documentation into ~800-character segments
- TF-IDF indexing for semantic search
- Precompile address matching (e.g., searching "0x0801" finds HTTP docs)
- Top-4 relevant chunks injected into each LLM prompt

### 🤖 Streaming LLM

- Real-time token streaming via Server-Sent Events (SSE)
- EIP-712 signed tokens for verification
- Claude Haiku 4.5 as default model
- Fallback to other models via `CHAT_MODEL` env var

### 💬 Chat Interface

- Persistent conversation history (last 6 messages sent to LLM)
- Markdown rendering with syntax highlighting
- Source citations showing which doc section answered each question
- Mobile-friendly responsive layout

### ⚡ Quick Suggestions

15 pre-loaded questions covering:

- Autonomous agents & properties
- Precompile usage & addresses
- Setup & deployment
- System contracts & patterns
- Authentication & security

## Architecture

```
User Question
    ↓
[RAG Search] — Chunks matched from 10 docs (TF-IDF)
    ↓
[Context Injection] — Top 4 chunks + system prompt sent to LLM
    ↓
[OpenRouter API] — Streaming completion via anthropic/claude-haiku-4-5
    ↓
[Frontend] — Real-time tokens + source citations displayed
    ↓
Chat History Stored in React state (ephemeral per session)
```

## Documentation Coverage

The 10 markdown files cover:

- ✅ Chain overview & vision
- ✅ 7 autonomous agent properties
- ✅ All 16 precompiles (addresses, ABIs, examples)
- ✅ Scheduler & recurring execution
- ✅ HTTP, Long HTTP, Secrets & ECIES
- ✅ LLM, FHE, ZK, Multimodal inference
- ✅ Passkeys, Ed25519, DKMS, X402 payments
- ✅ System contracts & consumer patterns
- ✅ Quick start, wallet setup, deployment
- ✅ Glossary with 40+ terms & FAQ

## Search Quality

The search optimizes for:

- **Exact phrase matching** — "0x0801" finds HTTP precompile docs
- **Token-level TF-IDF** — Common terms down-weighted
- **Addressability** — All precompile addresses indexed
- **Context size** — 800-char chunks with 150-char overlap

## Customization

### Add More Docs

1. Create `public/data/new-section.md`
2. Add filename to `sources` array in `app/page.js`
3. Restart dev server

### Change LLM Model

Update `.env.local`:

```env
CHAT_MODEL=openai/gpt-4-turbo
CHAT_MODEL=meta-llama/llama-2-70b-chat
CHAT_MODEL=google/gemini-2.0-flash
```

### Adjust Search Parameters

Edit `lib/search.js`:

- `TARGET` (chunk size, currently 800)
- `OVERLAP` (chunk overlap, currently 150)
- `topK` (results returned, currently 4)

## Deployment

### Vercel (Recommended)

```bash
vercel
```

- Auto-detects Next.js
- Edge Runtime for `/api/chat`
- Environment variables set in Vercel dashboard

### Docker

```bash
docker build -t ritual-assistant .
docker run -e OPENROUTER_API_KEY=sk_... -p 3000:3000 ritual-assistant
```

### Manual

```bash
npm run build
npm start
```

## Cost Estimation

Using OpenRouter + Claude Haiku:

- ~1000 tokens input (docs + query) = $0.00008
- ~500 tokens output = $0.00024
- **Per conversation: ~$0.0003 (0.03¢)**

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### "API error 401"

- Check `OPENROUTER_API_KEY` in `.env.local`
- Verify key is valid at openrouter.ai

### "messages required" Error

- API endpoint requires messages array
- Check that `/api/chat` is receiving proper payload

### Search Not Working

- Markdown files must be in `public/data/`
- Filenames must be in `sources` array in page.js
- Check browser console for fetch errors

### Slow Responses

- First request builds search index (chunks all 10 docs)
- Subsequent requests use cached index (fast)
- LLM latency depends on OpenRouter load

## Next Steps

1. **Try the chat** — Ask about precompiles, agents, or authentication
2. **Explore docs** — Click source citations to see full documentation
3. **Deploy** — Push to Vercel for production use
4. **Extend** — Add custom documentation sections
5. **Integrate** — Embed in your dApp or documentation site

## License

This Ritual Assistant is provided as-is. Ritual Chain documentation is maintained by Ritual Foundation.

## Support

For issues:

- Check the Glossary for term definitions
- Review the FAQ for common questions
- Visit docs.ritual.net for official documentation
