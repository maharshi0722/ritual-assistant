"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = [
  "What is Ritual Chain?",
  "What are the 7 properties of an autonomous agent?",
  "How does an agent achieve immortality on Ritual?",
  "How do I schedule recurring on-chain execution?",
];

let _docIndex = null;

async function getDocIndex() {
  if (_docIndex) return _docIndex;
  const { buildIndex, chunkMarkdown } = await import("../lib/search.js");
  const sources = [
    "vision",
    "agents",
    "precompiles",
    "scheduler",
    "real-world",
    "enshrined-ai",
    "authentication",
    "system-contracts",
    "quick-start",
    "glossary",
    "use-cases",
    "team",
    "research",
    "ritual-dapp-skills",
  ];
  const chunks = [];
  for (const src of sources) {
    try {
      const res = await fetch(`/data/${src}.md`);
      if (res.ok) {
        const text = await res.text();
        chunks.push(...chunkMarkdown(text, src));
      }
    } catch {}
  }
  _docIndex = buildIndex(chunks);
  return _docIndex;
}

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const sendInFlight = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const send = useCallback(
    async (question) => {
      if (!question.trim() || loading || sendInFlight.current) return;
      sendInFlight.current = true;
      setError(null);
      setSources([]);
      const index = await getDocIndex();
      const { searchChunks } = await import("../lib/search.js");
      const hits = searchChunks(index, question, 4);
      setSources(hits);
      const context = hits.length
        ? hits
            .map((h) => `[${h.source} §${h.index}]\n${h.text}`)
            .join("\n\n---\n\n")
        : "No relevant context found.";
      const userContent = `RITUAL DOCS CONTEXT:\n\n${context}\n\n---\n\nQUESTION: ${question}`;
      const history = messages.slice(-6);
      const apiMessages = [...history, { role: "user", content: userContent }];
      setMessages((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: "" },
      ]);
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: next[next.length - 1].content + token,
                  };
                  return next;
                });
              }
            } catch {}
          }
        }
        if (buf) {
          const lines = buf.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: next[next.length - 1].content + token,
                  };
                  return next;
                });
              }
            } catch {}
          }
        }
      } catch (err) {
        setError(err.message);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
        sendInFlight.current = false;
      }
    },
    [messages, loading],
  );

  const handleSubmit = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    send(q);
  };
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={S.shell}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            ...S.sidebar,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-280px)",
          }}
        >
          <div style={S.sidebarAccentBar} />
          <div style={S.sidebarHeader}>
            <div style={S.sidebarAvatarWrap}>
              <img
                src="/ritual-logo.png"
                alt="Ritual"
                style={S.sidebarAvatarImg}
              />
            </div>
            <div>
              <div style={S.sidebarName}>Ritual Assistant</div>
              <div style={S.sidebarTagline}>Documentation AI</div>
            </div>
          </div>
          <div style={S.hairline} />
          <div style={S.sidebarSection}>
            <div style={S.sectionLabel}>QUICK QUESTIONS</div>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                className="sb-btn"
                style={{ ...S.sbBtn, animationDelay: `${i * 0.06}s` }}
                onClick={() => {
                  send(s);
                  setSidebarOpen(false);
                }}
              >
                <span style={S.sbNum}>{String(i + 1).padStart(2, "0")}</span>
                <span style={S.sbText}>{s}</span>
                <span style={S.sbArrow}>›</span>
              </button>
            ))}
          </div>
          <div style={S.hairline} />
          <div style={S.sidebarSection}>
            <div style={S.sectionLabel}>KNOWLEDGE BASE</div>
            {[
              { icon: "◈", label: "Vision & Chain" },
              { icon: "⬡", label: "Autonomous Agents" },
              { icon: "⬢", label: "Precompiles" },
              { icon: "◷", label: "Scheduler" },
            ].map((d) => (
              <div key={d.label} style={S.kbRow}>
                <span style={S.kbIcon}>{d.icon}</span>
                <span style={S.kbLabel}>{d.label}</span>
                <span style={S.kbPill}>indexed</span>
              </div>
            ))}
          </div>
          {messages.length > 0 && (
            <div style={S.sbFooter}>
              <button
                className="clear-btn"
                style={S.clearBtn}
                onClick={() => {
                  setMessages([]);
                  setSources([]);
                  setSidebarOpen(false);
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                Clear conversation
              </button>
            </div>
          )}
        </aside>

        {sidebarOpen && (
          <div style={S.backdrop} onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main ── */}
        <div style={S.main}>
          {/* Header */}
          <header style={S.header}>
            <button
              className="menu-btn"
              style={S.menuBtn}
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Menu"
            >
              <span style={S.menuLine} />
              <span style={{ ...S.menuLine, width: 14 }} />
              <span style={{ ...S.menuLine, width: 17 }} />
            </button>
            <div style={S.headerBrand}>
              <div style={S.headerLogoBox}>
                <img
                  src="/ritual-logo.png"
                  alt="Ritual"
                  style={S.headerLogoImg}
                />
              </div>
              <div>
                <div style={S.headerTitle}>
                  Ritual <em style={S.headerTitleEm}>Assistant</em>
                </div>
                <div style={S.headerSub}>Powered by Ritual Chain docs</div>
              </div>
            </div>
            <div style={S.headerRight}>
              <div style={S.statusPill}>
                <span
                  className={loading ? "dot-pulse" : ""}
                  style={{
                    ...S.statusDot,
                    background: loading ? "#f59e0b" : "#22c55e",
                  }}
                />
                <span style={S.statusLabel}>
                  {loading ? "Thinking…" : "Ready"}
                </span>
              </div>
              {messages.length > 0 && (
                <button
                  className="icon-btn"
                  style={S.iconBtn}
                  title="New conversation"
                  onClick={() => {
                    setMessages([]);
                    setSources([]);
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
            </div>
          </header>

          {/* Chat */}
          <div
            style={{
              ...S.chatArea,
              overflowY: messages.length ? "auto" : "hidden",
            }}
            className={messages.length ? "scroll-area" : ""}
          >
            {messages.length === 0 ? (
              <div style={S.welcome} className="welcome-anim">
                {/* Hero logo */}
                <div style={S.heroWrap}>
                  <div style={S.heroRing} />
                  <div style={S.heroBox}>
                    <img
                      src="/ritual-logo.png"
                      alt="Ritual"
                      style={S.heroImg}
                    />
                  </div>
                </div>

                <h1 style={S.heroTitle}>
                  Ritual <em style={S.heroEm}>Assistant</em>
                </h1>
                <p style={S.heroDesc}>Ask anything about Ritual Chain</p>

                <div style={S.cardGrid} className="cardGrid">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={s}
                      className="sugg-card"
                      style={{
                        ...S.suggCard,
                        animationDelay: `${0.08 + i * 0.07}s`,
                      }}
                      onClick={() => send(s)}
                    >
                      <span style={S.cardNum}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={S.cardText}>{s}</span>
                      <span className="card-arrow" style={S.cardArrow}>
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={S.thread}>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className="msg-in"
                    style={m.role === "user" ? S.userRow : S.botRow}
                  >
                    {m.role === "assistant" && (
                      <div style={S.botAvatarBox} className="anim-pop">
                        <img
                          src="/ritual-logo.png"
                          alt=""
                          style={S.botAvatarImg}
                        />
                      </div>
                    )}
                    <div style={m.role === "user" ? S.userBubble : S.botBubble}>
                      {m.role === "user" ? (
                        <p style={S.userText}>{m.content}</p>
                      ) : (
                        <div className="prose">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content ||
                              (loading && i === messages.length - 1 ? "​" : "")}
                          </ReactMarkdown>
                          {loading && i === messages.length - 1 && (
                            <span className="cursor-blink" style={S.cursor}>
                              ▋
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {m.role === "user" && (
                      <div style={S.userAvatarBox}>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {/* Sources removed per user preference */}

                {error && (
                  <div className="msg-in" style={S.errorBox}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={S.inputBar}>
            <div style={S.inputGlow} />
            <div style={S.inputOuter}>
              <div className="input-box" style={S.inputBox}>
                <span style={S.inputSearchIcon}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about Ritual Chain…"
                  style={S.textarea}
                  rows={1}
                  disabled={loading}
                />
                <button
                  className="send-btn"
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  style={{
                    ...S.sendBtn,
                    opacity: !input.trim() || loading ? 0.4 : 1,
                    cursor:
                      !input.trim() || loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <span className="spin" style={S.spinner} />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── CSS ────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --g900: #0f4423; --g700: #1a6b3c; --g500: #2d8f55; --g300: #7ec49a;
    --g100: #e8f5ee; --g50:  #f2faf5;
    --cream: #faf8f4; --white: #ffffff;
    --ink: #18181b; --ink2: #3f3f46; --ink3: #71717a; --ink4: #a1a1aa; --ink5: #d4d4d8;
    --border: #e8e4dc; --border2: #d4cec4;
    --fs: 'DM Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --fm: 'DM Mono', 'Fira Code', monospace;
    --fserif: 'Playfair Display', Georgia, serif;
    --ease: cubic-bezier(0.4,0,0.2,1);
    --sh-green: 0 4px 20px rgba(26,107,60,0.2);
    --sh-green-sm: 0 2px 10px rgba(26,107,60,0.15);
    --sh-sm: 0 2px 6px rgba(0,0,0,0.06);
    --sh-md: 0 6px 24px rgba(0,0,0,0.09);
  }

  /* Scrollbar */
  .scroll-area { scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
  .scroll-area::-webkit-scrollbar { width: 4px; }
  .scroll-area::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* Animations */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes popIn    { from { opacity:0; transform:scale(0.75); } to { opacity:1; transform:scale(1); } }
  @keyframes slideCard{ from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes orbitSpin{ to { transform: rotate(360deg); } }
  @keyframes blink    { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes dotPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
    50%      { box-shadow: 0 0 0 5px rgba(245,158,11,0); }
  }
  @keyframes shimmer  {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .welcome-anim  { animation: fadeUp 0.45s var(--ease) both; }
  .msg-in        { animation: fadeUp 0.22s var(--ease) both; }
  .anim-pop      { animation: popIn  0.28s var(--ease) both; }
  .cursor-blink  { animation: blink 1s step-end infinite; }
  .spin          { animation: spin  0.75s linear infinite; }
  .dot-pulse     { animation: dotPulse 1.5s ease infinite; }
  .sugg-card     { animation: slideCard 0.4s var(--ease) both; }

  /* Sidebar buttons */
  .sb-btn { transition: background 0.14s, color 0.14s; }
  .sb-btn:hover { background: var(--g50) !important; color: var(--g700) !important; }
  .sb-btn:hover .sb-arrow { opacity:1 !important; transform: translateX(3px); }

  /* Suggestion cards */
  .sugg-card { transition: all 0.16s var(--ease) !important; }
  .sugg-card:hover { border-color: rgba(15,20,30,0.16) !important; background: rgba(255,255,255,0.98) !important; transform: translateY(-2px) !important; box-shadow: 0 24px 80px rgba(0,0,0,0.12) !important; }
  .sugg-card:hover .card-arrow { transform: translateX(5px); opacity:1 !important; }

  /* Menu */
  .menu-btn { transition: background 0.14s; }
  .menu-btn:hover { background: var(--g50) !important; }

  /* Icon btn */
  .icon-btn { transition: all 0.14s; }
  .icon-btn:hover { background: var(--g50) !important; color: var(--g700) !important; border-color: var(--g300) !important; }

  /* Clear */
  .clear-btn { transition: all 0.14s; }
  .clear-btn:hover { background: #fef2f2 !important; border-color: #fca5a5 !important; color: #dc2626 !important; }

  /* Input box focus */
  .input-box:focus-within {
    border-color: var(--g700) !important;
    box-shadow: var(--sh-md), 0 0 0 3px rgba(26,107,60,0.1) !important;
  }

  /* Send button */
  .send-btn:not(:disabled):hover { background: var(--g900) !important; transform: scale(1.07) !important; }
  .send-btn { transition: all 0.14s var(--ease); }

  /* Prose */
  .prose { font-family: var(--fs); font-size: 0.97rem; line-height: 1.92; color: rgba(15,20,30,0.96); }
  .prose p { margin: 0 0 0.85em; } .prose p:last-child { margin-bottom: 0; }
  .prose h1,.prose h2,.prose h3 { font-family: var(--fserif); color: rgba(15,20,30,0.96); margin: 1.25em 0 0.4em; line-height: 1.3; }
  .prose h1 { font-size: 1.22em; } .prose h2 { font-size: 1.1em; } .prose h3 { font-size: 1em; font-style: italic; }
  .prose ul,.prose ol { padding-left: 1.5em; margin: 0.5em 0; }
  .prose li { margin: 0.22em 0; }
  .prose strong { font-weight: 600; color: var(--ink); }
  .prose a { color: var(--g700); }
  .prose hr { border: none; border-top: 1px solid var(--border); margin: 1.2em 0; }
  .prose code {
    font-family: var(--fm); font-size: 0.82em;
    background: var(--g100); color: var(--g900);
    padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(26,107,60,0.2);
  }
  .prose pre {
    background: #f5f3ef; border: 1px solid var(--border);
    border-left: 3px solid var(--g700);
    border-radius: 8px; padding: 14px 16px;
    overflow-x: auto; margin: 0.9em 0;
  }
  .prose pre code { background:none; color:var(--ink2); padding:0; border:none; font-size:0.83em; line-height:1.65; }
  .prose table { width:100%; border-collapse:collapse; font-size:0.86em; margin:0.9em 0; }
  .prose th {
    background: var(--g100); color: var(--g900); font-weight:600;
    font-size:0.78em; letter-spacing:0.04em; text-align:left;
    padding:8px 12px; border:1px solid rgba(26,107,60,0.2);
  }
  .prose td { padding:7px 12px; border:1px solid var(--border); color:var(--ink2); vertical-align:top; }
  .prose tr:nth-child(even) td { background: rgba(0,0,0,0.016); }
  .prose img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em auto;
    border-radius: 14px;
    object-fit: contain;
  }
  .prose img:not([src]) { max-width: 100%; }

  /* Responsive */
  @media (max-width: 640px) {
    .prose { font-size: 0.87rem; }
  }
  @media (max-width: 720px) {
    .cardGrid { grid-template-columns: 1fr !important; max-width: 520px; }
  }
`;

// ── Styles ─────────────────────────────────────────────────────
const S = {
  shell: {
    display: "flex",
    minHeight: "100dvh",
    backgroundColor: "var(--cream)",
    backgroundImage: "url('/bg.png')",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    overflow: "hidden",
    position: "relative",
    fontFamily: "var(--fs)",
  },

  // ── Sidebar
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    background: "var(--white)",
    borderRight: "1px solid var(--border)",
    zIndex: 50,
    transition: "transform 0.28s var(--ease)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "var(--sh-md)",
    overflowY: "auto",
  },
  sidebarAccentBar: {
    height: 3,
    flexShrink: 0,
    background:
      "linear-gradient(90deg, var(--g900) 0%, var(--g500) 50%, var(--g100) 100%)",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "18px 18px 15px",
  },
  sidebarAvatarWrap: {
    width: 38,
    height: 38,
    background: "var(--g700)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "var(--sh-green-sm)",
  },
  sidebarAvatarImg: { width: 23, height: 23, objectFit: "contain" },
  sidebarName: {
    fontFamily: "var(--fserif)",
    fontSize: "0.97rem",
    fontWeight: 500,
    color: "var(--ink)",
    lineHeight: 1.25,
  },
  sidebarTagline: { fontSize: "0.67rem", color: "var(--ink4)", marginTop: 2 },
  hairline: {
    height: 1,
    margin: "0",
    background:
      "linear-gradient(90deg, transparent, var(--border), transparent)",
    flexShrink: 0,
  },
  sidebarSection: { padding: "12px 12px 6px" },
  sectionLabel: {
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.13em",
    color: "var(--ink4)",
    marginBottom: 8,
    paddingLeft: 4,
  },
  sbBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    width: "100%",
    background: "transparent",
    border: "none",
    padding: "9px 8px",
    fontSize: "0.81rem",
    color: "var(--ink2)",
    cursor: "pointer",
    borderRadius: 6,
    marginBottom: 1,
    textAlign: "left",
    fontFamily: "var(--fs)",
  },
  sbNum: {
    fontSize: "0.62rem",
    fontFamily: "var(--fm)",
    color: "var(--g500)",
    fontWeight: 600,
    flexShrink: 0,
    width: 18,
  },
  sbText: { flex: 1, lineHeight: 1.4 },
  sbArrow: {
    fontSize: "1rem",
    color: "var(--g500)",
    opacity: 0,
    transition: "all 0.14s",
    flexShrink: 0,
  },
  kbRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "6px 8px",
    borderRadius: 6,
    marginBottom: 1,
  },
  kbIcon: {
    fontSize: "0.88rem",
    color: "var(--g700)",
    width: 18,
    textAlign: "center",
    flexShrink: 0,
  },
  kbLabel: { fontSize: "0.81rem", color: "var(--ink3)", flex: 1 },
  kbPill: {
    fontSize: "0.58rem",
    background: "var(--g100)",
    color: "var(--g700)",
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  sbFooter: {
    marginTop: "auto",
    padding: "14px 12px",
    borderTop: "1px solid var(--border)",
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    padding: "9px 14px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: "0.81rem",
    color: "var(--ink3)",
    cursor: "pointer",
    fontFamily: "var(--fs)",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    background: "rgba(0,0,0,0.18)",
    backdropFilter: "blur(2px)",
  },

  // ── Main
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: "100%",
    position: "relative",
  },

  // ── Header
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 20px",
    height: 60,
    width: "100%",
    background: "rgba(255,255,255,0.10)",
    backdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(255,255,255,0.16)",
    flexShrink: 0,
    boxShadow: "0 1px 0 rgba(255,255,255,0.08)",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  },
  menuBtn: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px 6px",
    borderRadius: 6,
    flexShrink: 0,
  },
  menuLine: {
    display: "block",
    width: 20,
    height: 2,
    background: "rgba(255,255,255,0.9)",
    borderRadius: 1,
  },
  headerBrand: { display: "flex", alignItems: "center", gap: 11, flex: 1 },
  headerLogoBox: {
    width: 36,
    height: 36,
    background: "var(--g700)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--sh-green-sm)",
    flexShrink: 0,
  },
  headerLogoImg: { width: 22, height: 22, objectFit: "contain" },
  headerTitle: {
    fontFamily: "var(--fserif)",
    fontSize: "1.04rem",
    fontWeight: 500,
    color: "var(--white)",
    lineHeight: 1.25,
    letterSpacing: "-0.01em",
  },
  headerTitleEm: { fontStyle: "italic", color: "var(--g700)" },
  headerSub: {
    fontSize: "0.67rem",
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
    fontWeight: 400,
  },
  headerRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.24)",
    padding: "5px 12px",
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background 0.2s",
  },
  statusLabel: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.92)",
    fontFamily: "var(--fm)",
    fontWeight: 600,
  },
  iconBtn: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.24)",
    borderRadius: 6,
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
  },

  // ── Chat area
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "100px 20px 120px",
    background: "transparent",
  },

  // ── Welcome
  welcome: {
    maxWidth: 620,
    margin: "0 auto",
    paddingTop: "6vh",
    textAlign: "center",
    color: "var(--white)",
  },
  heroWrap: {
    position: "relative",
    width: 96,
    height: 96,
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroRing: {
    position: "absolute",
    inset: -10,
    borderRadius: "50%",
    border: "1.5px dashed rgba(26,107,60,0.3)",
    animation: "orbitSpin 10s linear infinite",
  },
  heroBox: {
    width: 78,
    height: 78,
    background: "var(--g700)",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--sh-green), 0 0 0 8px rgba(26,107,60,0.07)",
    position: "relative",
    zIndex: 1,
  },
  heroImg: { width: 48, height: 48, objectFit: "contain" },
  heroTitle: {
    fontFamily: "var(--fserif)",
    fontSize: "2.4rem",
    fontWeight: 700,
    color: "var(--white)",
    marginBottom: 14,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  heroEm: { fontStyle: "italic", color: "var(--g700)" },
  heroDesc: {
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.9,
    marginBottom: 28,
    fontWeight: 400,
    maxWidth: 540,
    margin: "0 auto 32px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    maxWidth: 760,
    margin: "0 auto",
  },
  suggCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(15,20,30,0.12)",
    borderRadius: 16,
    padding: "16px 20px",
    fontSize: "1rem",
    color: "rgba(15,20,30,0.96)",
    cursor: "pointer",
    lineHeight: 1.6,
    fontFamily: "var(--fs)",
    fontWeight: 700,
    boxShadow: "0 24px 70px rgba(0,0,0,0.08)",
    textAlign: "left",
    minWidth: 0,
  },
  cardNum: {
    fontSize: "0.68rem",
    fontFamily: "var(--fm)",
    color: "rgba(15,20,30,0.75)",
    fontWeight: 700,
    flexShrink: 0,
    opacity: 1,
    width: 18,
  },
  cardText: { flex: 1 },
  cardArrow: {
    fontSize: "0.88rem",
    color: "rgba(15,20,30,0.75)",
    flexShrink: 0,
    opacity: 0.95,
    transition: "transform 0.15s, opacity 0.15s",
  },
  heroFootnote: {
    fontSize: "0.66rem",
    color: "var(--ink5)",
    marginTop: 28,
    fontFamily: "var(--fm)",
    letterSpacing: "0.02em",
  },

  // ── Thread
  thread: {
    maxWidth: 760,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    paddingBottom: 8,
  },
  userRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    justifyContent: "flex-end",
  },
  botRow: { display: "flex", alignItems: "flex-start", gap: 10 },
  botAvatarBox: {
    width: 32,
    height: 32,
    background: "var(--g700)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 3,
    boxShadow: "var(--sh-green-sm)",
  },
  botAvatarImg: { width: 19, height: 19, objectFit: "contain" },
  userAvatarBox: {
    width: 32,
    height: 32,
    background: "var(--ink)",
    color: "rgba(255,255,255,0.85)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 3,
  },
  userBubble: {
    maxWidth: "70%",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: "14px 4px 14px 14px",
    padding: "14px 18px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  },
  userText: {
    color: "rgba(15,20,30,0.95)",
    fontSize: "1rem",
    lineHeight: 1.8,
    fontWeight: 600,
    margin: 0,
  },
  botBubble: {
    flex: 1,
    maxWidth: "87%",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "4px 14px 14px 14px",
    padding: "16px 18px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
    fontSize: "1rem",
    lineHeight: 1.8,
  },
  cursor: {
    display: "inline-block",
    color: "var(--g700)",
    fontSize: "0.85em",
    marginLeft: 2,
    verticalAlign: "middle",
  },

  // ── Error
  errorBox: {
    background: "#fff8f8",
    border: "1px solid #fecaca",
    borderLeft: "3px solid #dc2626",
    borderRadius: 10,
    color: "#dc2626",
    padding: "12px 16px",
    fontSize: "0.84rem",
    display: "flex",
    gap: 10,
    alignItems: "center",
    maxWidth: 760,
    margin: "0 auto",
    width: "100%",
  },

  // ── Input bar
  inputBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "0 0 16px",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.18)",
    flexShrink: 0,
    zIndex: 30,
  },
  inputGlow: {
    height: 2,
    marginBottom: 12,
    background:
      "linear-gradient(90deg, transparent 0%, var(--g700) 25%, var(--g300) 50%, var(--g700) 75%, transparent 100%)",
    opacity: 0.3,
  },
  inputOuter: { maxWidth: 760, margin: "0 auto", padding: "0 20px" },
  inputBox: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    background: "rgba(255,255,255,0.16)",
    border: "1.5px solid rgba(255,255,255,0.22)",
    borderRadius: 14,
    padding: "8px 10px 8px 14px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
    transition: "all 0.15s var(--ease)",
  },
  inputSearchIcon: {
    color: "rgba(255,255,255,0.7)",
    flexShrink: 0,
    paddingBottom: 8,
    display: "flex",
    alignItems: "center",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    fontFamily: "var(--fs)",
    fontSize: "1.06rem",
    color: "black",
    lineHeight: 1.8,
    padding: "8px 0",
    minHeight: 32,
    maxHeight: 160,
    fontWeight: 500,
  },
  sendBtn: {
    width: 37,
    height: 37,
    background: "var(--g700)",
    color: "var(--white)",
    border: "none",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "var(--sh-green-sm)",
  },
  spinner: {
    display: "block",
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
  },
  inputFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 7,
    padding: "0 2px",
    color: "rgba(255,255,255,0.7)",
  },
  inputHintText: {
    fontSize: "0.67rem",
    color: "rgba(255,255,255,0.65)",
    fontFamily: "var(--fm)",
    letterSpacing: "0.02em",
  },
  exchangeCount: {
    fontSize: "0.67rem",
    color: "rgba(255,255,255,0.65)",
    fontFamily: "var(--fm)",
  },
};
