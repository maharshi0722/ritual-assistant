"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = [
  "What are the 7 properties of an autonomous agent?",
  "What precompile address handles HTTP calls?",
  "How does an agent achieve immortality on Ritual?",
  "Explain sync vs async precompiles",
  "How do I schedule recurring on-chain execution?",
  "What is DKMS and why do agents need it?",
  "How does FHE inference work?",
  "How do I set up my wallet for Ritual Chain?",
  "What's the difference between SPC and two-phase async?",
  "How do I pass API keys securely using ECIES?",
  "What system contracts do I need to know about?",
  "How do passkeys work on Ritual?",
  "What is the Scheduler and how do I use it?",
  "Explain computational sovereignty",
  "How do I call the LLM precompile from Solidity?",
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const send = useCallback(
    async (question) => {
      if (!question.trim() || loading) return;
      setError(null);
      setSources([]);

      // 1. RAG search
      const index = await getDocIndex();
      const { searchChunks } = await import("../lib/search.js");
      const hits = searchChunks(index, question, 4);
      setSources(hits);

      const context = hits.length
        ? hits
            .map((h) => `[${h.source} §${h.index}]\n${h.text}`)
            .join("\n\n---\n\n")
        : "No relevant context found.";

      // 2. Build messages for API
      const userContent = `RITUAL DOCS CONTEXT:\n\n${context}\n\n---\n\nQUESTION: ${question}`;
      const history = messages.slice(-6);
      const apiMessages = [...history, { role: "user", content: userContent }];

      // 3. Update UI
      setMessages((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: "" },
      ]);
      setLoading(true);

      // 4. Stream
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
      } catch (err) {
        setError(err.message);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
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
    <div style={S.shell}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          ...S.sidebar,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div style={S.sidebarHeader}>
          <img src="/ritual-logo.png" alt="Ritual" style={S.sidebarLogo} />
          <span style={S.sidebarTitle}>Ritual Assistant</span>
        </div>
        <div style={S.sidebarSection}>
          <p style={S.sidebarLabel}>QUICK QUESTIONS</p>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              style={S.sidebarBtn}
              onClick={() => {
                send(s);
                setSidebarOpen(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--green-pale)";
                e.currentTarget.style.color = "var(--green)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink-soft)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={S.sidebarSection}>
          <p style={S.sidebarLabel}>DOCS COVERAGE</p>
          {[
            "Vision & Chain",
            "Autonomous Agents",
            "Precompiles",
            "Scheduler",
          ].map((d) => (
            <div key={d} style={S.docChip}>
              <span style={S.docDot} />
              {d}
            </div>
          ))}
        </div>
        {messages.length > 0 && (
          <button
            style={S.clearBtn}
            onClick={() => {
              setMessages([]);
              setSources([]);
              setSidebarOpen(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--green-pale)";
              e.currentTarget.style.borderColor = "var(--green)";
              e.currentTarget.style.color = "var(--green)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.color = "var(--ink-muted)";
            }}
          >
            Clear conversation
          </button>
        )}
      </aside>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div style={S.backdrop} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div style={S.main}>
        {/* Header */}
        <header style={S.header}>
          <button
            style={S.menuBtn}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Menu"
          >
            <span style={S.menuLine} />
            <span style={S.menuLine} />
            <span style={S.menuLine} />
          </button>
          <div style={S.headerBrand}>
            <img src="/ritual-logo.png" alt="Ritual" style={S.headerLogo} />
            <div>
              <div style={S.headerTitle}>Ritual Assistant</div>
              <div style={S.headerSub}>Powered by Ritual Chain docs</div>
            </div>
          </div>
          <div style={S.headerStatus}>
            <span
              style={{
                ...S.statusDot,
                background: loading ? "#f59e0b" : "#22c55e",
              }}
            />
            <span style={S.statusText}>{loading ? "Thinking" : "Ready"}</span>
          </div>
        </header>

        {/* Chat area */}
        <div style={S.chatArea}>
          {messages.length === 0 ? (
            <div style={S.welcome}>
              <div style={S.welcomeLogoWrap}>
                <img
                  src="/ritual-logo.png"
                  alt="Ritual"
                  style={S.welcomeLogo}
                />
              </div>
              <h1 style={S.welcomeTitle}>Ritual Assistant</h1>
              <p style={S.welcomeDesc}>
                Ask anything about Ritual Chain — precompiles, autonomous
                agents,
                <br />
                the Scheduler, TEEs, FHE, DKMS, and more.
              </p>
              <div style={S.suggGrid}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    style={S.suggCard}
                    onClick={() => send(s)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--green)";
                      e.currentTarget.style.background = "var(--green-pale)";
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--white)";
                      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <span style={S.suggArrow}>→</span>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={S.thread}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={m.role === "user" ? S.userRow : S.botRow}
                  className="msg-enter"
                >
                  {m.role === "assistant" && (
                    <div style={S.botAvatar}>
                      <img
                        src="/ritual-logo.png"
                        alt="Ritual"
                        style={S.botAvatarImg}
                      />
                    </div>
                  )}
                  <div style={m.role === "user" ? S.userBubble : S.botBubble}>
                    {m.role === "user" ? (
                      <p style={S.userText}>{m.content}</p>
                    ) : (
                      <div className="prose" style={{ fontSize: "0.93rem" }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content ||
                            (loading && i === messages.length - 1 ? "​" : "")}
                        </ReactMarkdown>
                        {loading && i === messages.length - 1 && (
                          <span style={S.cursor}>|</span>
                        )}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && <div style={S.userAvatar}>You</div>}
                </div>
              ))}

              {/* Sources */}
              {sources.length > 0 && !loading && (
                <div style={S.sourcesRow}>
                  <span style={S.sourcesLabel}>Sources</span>
                  {sources.map((src, i) => (
                    <span key={i} style={S.sourceChip}>
                      {src.source}
                      <span style={S.sourceScore}>§{src.index}</span>
                    </span>
                  ))}
                </div>
              )}

              {error && (
                <div style={S.errorBox}>
                  <span style={S.errorIcon}>⚠</span> {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={S.inputBar}>
          <div
            style={S.inputWrap}
            onFocus={(e) => {
              if (e.target.tagName === "TEXTAREA") {
                e.currentTarget.style.borderColor = "var(--green)";
                e.currentTarget.style.boxShadow =
                  "var(--shadow-lg), 0 0 0 3px var(--green-pale)";
              }
            }}
            onBlur={(e) => {
              if (e.target.tagName === "TEXTAREA") {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Ritual Chain..."
              style={S.textarea}
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                ...S.sendBtn,
                opacity: !input.trim() || loading ? 0.4 : 1,
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={S.spinner} />
              ) : (
                <svg
                  width="18"
                  height="18"
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
          <p style={S.inputHint}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────

const S = {
  shell: {
    display: "flex",
    height: "100dvh",
    background: "var(--cream)",
    overflow: "hidden",
    position: "relative",
  },

  // Sidebar - Premium
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    background: "var(--white)",
    borderRight: "1px solid var(--border)",
    zIndex: 50,
    transition: "transform var(--transition-base)",
    display: "flex",
    flexDirection: "column",
    padding: "0 0 20px",
    boxShadow: "var(--shadow-lg)",
    overflowY: "auto",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 20px 16px",
    borderBottom: "1px solid var(--border)",
    marginBottom: 8,
  },
  sidebarLogo: { width: 32, height: 32, objectFit: "contain" },
  sidebarTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
  },
  sidebarSection: { padding: "14px 16px" },
  sidebarLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "var(--ink-faint)",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  sidebarBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    padding: "10px 12px",
    fontSize: "0.82rem",
    color: "var(--ink-soft)",
    cursor: "pointer",
    borderRadius: "var(--radius-sm)",
    lineHeight: 1.45,
    marginBottom: 4,
    transition: "all var(--transition-fast)",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
  },
  docChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    fontSize: "0.8rem",
    color: "var(--ink-muted)",
    borderRadius: "var(--radius-sm)",
    transition: "background var(--transition-fast)",
  },
  docDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--success)",
    flexShrink: 0,
  },
  clearBtn: {
    margin: "auto 16px 0",
    padding: "10px 16px",
    background: "transparent",
    border: "1.5px solid var(--border-strong)",
    borderRadius: "var(--radius-md)",
    fontSize: "0.82rem",
    fontWeight: 500,
    color: "var(--ink-muted)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "all var(--transition-fast)",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    background: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(2px)",
    transition: "opacity var(--transition-base)",
  },

  // Main
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    height: "100%",
  },

  // Header - Premium
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 20px",
    background: "var(--white)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    boxShadow: "var(--shadow-xs)",
  },
  menuBtn: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px 6px",
    borderRadius: "var(--radius-sm)",
    flexShrink: 0,
    transition: "all var(--transition-fast)",
  },
  menuLine: {
    display: "block",
    width: 20,
    height: 2.5,
    background: "var(--ink-soft)",
    borderRadius: 1.25,
    transition: "all var(--transition-fast)",
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerLogo: { width: 36, height: 36, objectFit: "contain" },
  headerTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--ink)",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
  },
  headerSub: {
    fontSize: "0.7rem",
    color: "var(--ink-faint)",
    marginTop: 2,
    fontWeight: 500,
  },
  headerStatus: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    boxShadow: "0 0 0 2px var(--white), 0 0 4px currentColor",
    transition:
      "background var(--transition-fast), box-shadow var(--transition-fast)",
  },
  statusText: {
    fontSize: "0.75rem",
    color: "var(--ink-muted)",
    fontFamily: "var(--font-mono)",
    fontWeight: 500,
  },

  // Chat
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "28px 24px",
    background: "var(--cream)",
  },

  // Welcome - Premium
  welcome: {
    maxWidth: 720,
    margin: "0 auto",
    paddingTop: "8vh",
    textAlign: "center",
  },
  welcomeLogoWrap: {
    width: 80,
    height: 80,
    borderRadius: "var(--radius-xl)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
  },
  welcomeLogo: { width: 52, height: 52, objectFit: "contain" },
  welcomeTitle: {
    fontSize: "1.9rem",
    fontWeight: 700,
    color: "var(--ink)",
    marginBottom: 14,
    letterSpacing: "-0.02em",
  },
  welcomeDesc: {
    fontSize: "0.95rem",
    color: "var(--ink-muted)",
    lineHeight: 1.75,
    marginBottom: 40,
    fontWeight: 500,
  },
  suggGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
    textAlign: "left",
  },
  suggCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "var(--white)",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    fontSize: "0.85rem",
    color: "var(--ink-soft)",
    cursor: "pointer",
    lineHeight: 1.5,
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    transition: "all var(--transition-fast)",
    boxShadow: "var(--shadow-sm)",
    textAlign: "left",
  },
  suggArrow: {
    color: "var(--green)",
    flexShrink: 0,
    fontSize: "1rem",
    marginTop: 0,
    transition: "transform var(--transition-fast)",
  },

  // Thread - Premium
  thread: {
    maxWidth: 800,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  userRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    justifyContent: "flex-end",
    animation: "fadeUp var(--transition-base) ease",
  },
  botRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    animation: "fadeUp var(--transition-base) ease",
  },
  botAvatar: {
    width: 36,
    height: 36,
    background:
      "linear-gradient(135deg, var(--green) 0%, var(--green-light) 100%)",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
    boxShadow: "var(--shadow-green)",
  },
  botAvatarImg: { width: 20, height: 20, objectFit: "contain" },
  userAvatar: {
    width: 36,
    height: 36,
    background: "var(--ink)",
    color: "var(--white)",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 2,
    letterSpacing: "0.02em",
  },
  userBubble: {
    maxWidth: "72%",
    background:
      "linear-gradient(135deg, var(--green) 0%, var(--green-light) 100%)",
    borderRadius: "16px 4px 16px 16px",
    padding: "12px 16px",
    boxShadow: "var(--shadow-green)",
  },
  userText: {
    color: "var(--white)",
    fontSize: "0.93rem",
    lineHeight: 1.6,
    fontWeight: 500,
  },
  botBubble: {
    flex: 1,
    maxWidth: "88%",
    background: "var(--white)",
    border: "1px solid var(--border)",
    borderRadius: "6px 16px 16px 16px",
    padding: "16px 18px",
    boxShadow: "var(--shadow-sm)",
  },
  cursor: {
    display: "inline-block",
    animation: "blink 1.2s step-end infinite",
    color: "var(--green)",
    fontWeight: 400,
    marginLeft: 2,
  },

  // Sources - Premium
  sourcesRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingLeft: 48,
    marginTop: 4,
  },
  sourcesLabel: {
    fontSize: "0.7rem",
    color: "var(--ink-faint)",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  sourceChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "var(--green-pale)",
    border: "1px solid var(--green-border)",
    color: "var(--green)",
    padding: "4px 11px",
    borderRadius: "20px",
    fontSize: "0.72rem",
    fontWeight: 600,
    transition: "all var(--transition-fast)",
  },
  sourceScore: {
    color: "var(--green-mid)",
    fontSize: "0.65rem",
    fontWeight: 700,
  },

  // Error - Premium
  errorBox: {
    background: "linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)",
    border: "1.5px solid #fecaca",
    borderRadius: "var(--radius-md)",
    color: "#dc2626",
    padding: "12px 16px",
    fontSize: "0.85rem",
    display: "flex",
    gap: 10,
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(220, 38, 38, 0.1)",
  },
  errorIcon: { fontSize: "1.1rem", flexShrink: 0 },

  // Input - Premium
  inputBar: {
    padding: "16px 24px 18px",
    background: "var(--white)",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
    boxShadow: "0 -2px 8px rgba(0,0,0,0.03)",
  },
  inputWrap: {
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
    maxWidth: 800,
    margin: "0 auto",
    background: "var(--cream)",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "10px 12px 10px 18px",
    boxShadow: "var(--shadow-sm)",
    transition: "all var(--transition-fast)",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    fontFamily: "var(--font-sans)",
    fontSize: "0.94rem",
    color: "var(--ink)",
    lineHeight: 1.6,
    padding: "6px 0",
    minHeight: 24,
    maxHeight: 120,
    fontWeight: 500,
  },
  sendBtn: {
    width: 40,
    height: 40,
    background:
      "linear-gradient(135deg, var(--green) 0%, var(--green-light) 100%)",
    color: "var(--white)",
    border: "none",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all var(--transition-fast)",
    boxShadow: "var(--shadow-green)",
    cursor: "pointer",
    fontWeight: 600,
  },
  spinner: {
    display: "block",
    width: 18,
    height: 18,
    border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  inputHint: {
    textAlign: "center",
    fontSize: "0.68rem",
    color: "var(--ink-faint)",
    marginTop: 8,
    maxWidth: 800,
    marginLeft: "auto",
    marginRight: "auto",
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
};
