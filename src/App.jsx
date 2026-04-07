import { useState, useEffect, useRef } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`;

const THEMES = {
  purple: { name: "Purple Night", accent: "#6c63ff", accent2: "#a78bfa", darkBg: "#0d0d1a", darkSurface: "#161628", darkCard: "#1e1e2e" },
  emerald: { name: "Emerald", accent: "#10b981", accent2: "#34d399", darkBg: "#0a1a14", darkSurface: "#0f2419", darkCard: "#163020" },
  rose: { name: "Rose", accent: "#f43f5e", accent2: "#fb7185", darkBg: "#1a0d10", darkSurface: "#261218", darkCard: "#2e1620" },
  amber: { name: "Amber", accent: "#f59e0b", accent2: "#fcd34d", darkBg: "#1a1500", darkSurface: "#261e00", darkCard: "#2e2500" },
  cyan: { name: "Ocean", accent: "#06b6d4", accent2: "#67e8f9", darkBg: "#0a1520", darkSurface: "#0f1e2e", darkCard: "#162438" },
  slate: { name: "Slate", accent: "#64748b", accent2: "#94a3b8", darkBg: "#0f1117", darkSurface: "#161b27", darkCard: "#1e2536" },
};

const ADMIN_PASSWORD = "admin123";

function estimateTokens(t) { return Math.ceil((t || "").length / 4); }
function generateId() { return Math.random().toString(36).slice(2, 10); }
function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatDate(ts) { return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" }); }

const REACTIONS = ["👍", "❤️", "😂", "🔥", "🤯", "👏"];

function BarChart({ data, color, label }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div style={{ fontSize: "0.72rem", color: "#888", marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", position: "relative", height: 52 }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: `${color}33`, borderRadius: "4px 4px 0 0", height: "100%" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: color, borderRadius: "4px 4px 0 0", height: `${(d.value / max) * 100}%`, transition: "height 0.6s ease" }} />
            </div>
            <div style={{ fontSize: "0.6rem", color: "#666", whiteSpace: "nowrap" }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments, size = 80 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  const r = 28, cx = 40, cy = 40, circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff10" strokeWidth="10" />
      {segments.map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circumference;
        const rotation = offset * 360 - 90;
        offset += pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(${rotation} ${cx} ${cy})`} style={{ transition: "all 0.5s" }} />;
      })}
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#e8e6f0" fontSize="12" fontWeight="bold">{total}</text>
    </svg>
  );
}

function TypeWriter({ text, onDone, speed = 10 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    idx.current = 0; setDisplayed("");
    const iv = setInterval(() => {
      if (idx.current < text.length) { setDisplayed(text.slice(0, idx.current + 1)); idx.current++; }
      else { clearInterval(iv); onDone && onDone(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{displayed}<span style={{ opacity: 0.5, animation: "blink 1s step-end infinite" }}>▌</span></span>;
}

function ActionBtn({ icon, title, onClick, dark, active, accent }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: "0.75rem", background: active ? `${accent}33` : (dark ? "#ffffff0d" : "#0000000d"), color: active ? accent : (dark ? "#888" : "#999"), display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
      {icon}
    </button>
  );
}

function MessageBubble({ msg, dark, onReact, isLatest, onTypeDone, accent, accent2 }) {
  const [copied, setCopied] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [typed, setTyped] = useState(!isLatest || msg.role === "user");
  const isUser = msg.role === "user";
  const copyMsg = () => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const speakMsg = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(msg.content);
    utt.onend = () => setSpeaking(false); setSpeaking(true); window.speechSynthesis.speak(utt);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{ fontSize: "0.7rem", color: dark ? "#666" : "#aaa", marginBottom: 4, paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0 }}>
        {isUser ? "You" : "✦ Aura"} · {formatTime(msg.ts)}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isUser ? "row-reverse" : "row" }}>
        <div style={{ maxWidth: "72%", padding: "14px 18px", borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px", background: isUser ? `linear-gradient(135deg, ${accent}, ${accent2})` : dark ? "#1e1e2e" : "#f5f5f7", color: isUser ? "#fff" : dark ? "#e8e6f0" : "#1a1a2e", boxShadow: isUser ? `0 4px 20px ${accent}55` : dark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.08)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.92rem", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.imageUrl && <div style={{ marginBottom: 10 }}><img src={msg.imageUrl} alt="generated" style={{ maxWidth: "100%", borderRadius: 12, display: "block" }} /><div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: 6 }}>🎨 AI Generated</div></div>}
          {!isUser && isLatest && !typed ? <TypeWriter text={msg.content} speed={10} onDone={() => { setTyped(true); onTypeDone && onTypeDone(); }} /> : <span>{msg.content}</span>}
          {msg.reactions && msg.reactions.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[...new Set(msg.reactions)].map(r => <span key={r} style={{ background: dark ? "#2a2a3e" : "#e8e8ef", borderRadius: 12, padding: "2px 8px", fontSize: "0.78rem", cursor: "pointer" }} onClick={() => onReact(msg.id, r)}>{r} {msg.reactions.filter(x => x === r).length}</span>)}
            </div>
          )}
        </div>
        {typed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <ActionBtn icon={copied ? "✓" : "⧉"} title="Copy" onClick={copyMsg} dark={dark} active={copied} accent={accent} />
            {!isUser && <ActionBtn icon={speaking ? "⏹" : "🔊"} title="Speak" onClick={speakMsg} dark={dark} active={speaking} accent={accent} />}
            {!isUser && <ActionBtn icon="😊" title="React" onClick={() => setShowReactions(v => !v)} dark={dark} active={showReactions} accent={accent} />}
          </div>
        )}
      </div>
      {showReactions && !isUser && (
        <div style={{ display: "flex", gap: 6, marginTop: 6, marginLeft: 8, background: dark ? "#1e1e2e" : "#fff", borderRadius: 20, padding: "6px 12px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", border: `1px solid ${dark ? "#333" : "#e0e0e0"}` }}>
          {REACTIONS.map(r => <span key={r} style={{ fontSize: "1.2rem", cursor: "pointer", transition: "transform 0.1s" }} onMouseEnter={e => e.target.style.transform = "scale(1.3)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} onClick={() => { onReact(msg.id, r); setShowReactions(false); }}>{r}</span>)}
        </div>
      )}
    </div>
  );
}

function AdminPanel({ users, dark, accent, accent2, onClose }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminPass, setAdminPass] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [viewingChat, setViewingChat] = useState(null);
  const c = { bg: dark ? "#0d0d1a" : "#f8f8fc", surface: dark ? "#161628" : "#fff", card: dark ? "#1e1e2e" : "#f5f5f7", border: dark ? "#2a2a40" : "#e8e8f0", text: dark ? "#e8e6f0" : "#1a1a2e", muted: dark ? "#666680" : "#9090a0" };
  const getUserSessions = (u) => JSON.parse(localStorage.getItem(`aura_sessions_${u}`) || "{}");
  const allUsers = Object.entries(users);

  if (!authenticated) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }}>
        <div style={{ background: c.surface, borderRadius: 20, padding: "36px 32px", width: 360, boxShadow: "0 24px 80px rgba(0,0,0,0.5)", border: `1px solid ${c.border}`, animation: "fadeUp 0.3s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>👑</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: c.text }}>Admin Access</div>
            <div style={{ fontSize: "0.8rem", color: c.muted, marginTop: 4 }}>Password: admin123</div>
          </div>
          <input type="password" placeholder="Admin password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { if (adminPass === ADMIN_PASSWORD) { setAuthenticated(true); setAuthError(""); } else setAuthError("Wrong password"); } }}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${c.border}`, background: dark ? "#0d0d1a" : "#f5f5f7", color: c.text, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", marginBottom: 8 }}
            onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = c.border} />
          {authError && <div style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: 8 }}>{authError}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { if (adminPass === ADMIN_PASSWORD) { setAuthenticated(true); } else setAuthError("Wrong password"); }}
              style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Enter →</button>
            <button onClick={onClose} style={{ padding: "11px 16px", borderRadius: 12, border: `1px solid ${c.border}`, background: "transparent", color: c.muted, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const totalMsgs = allUsers.reduce((a, [u]) => a + Object.values(getUserSessions(u)).reduce((b, s) => b + s.messages.length, 0), 0);
  const chartData = allUsers.slice(0, 7).map(([u]) => ({ label: u.slice(0, 4), value: Object.values(getUserSessions(u)).reduce((a, s) => a + s.messages.length, 0) }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }}>
      <div style={{ background: c.surface, borderRadius: 24, width: "90vw", maxWidth: 900, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", border: `1px solid ${c.border}`, animation: "fadeUp 0.3s ease" }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${accent}22, ${accent2}11)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>👑</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: c.text }}>Admin Panel</div>
              <div style={{ fontSize: "0.72rem", color: c.muted }}>{allUsers.length} users · {totalMsgs} total messages</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${c.border}`, background: "transparent", color: c.muted, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 240, borderRight: `1px solid ${c.border}`, overflowY: "auto", padding: "16px 12px" }}>
            <div style={{ fontSize: "0.68rem", color: c.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 8px 10px" }}>All Users</div>
            {allUsers.map(([username]) => {
              const s = getUserSessions(username);
              const msgs = Object.values(s).reduce((a, sess) => a + sess.messages.length, 0);
              return (
                <div key={username} onClick={() => setSelectedUser(username)}
                  style={{ padding: "12px", borderRadius: 12, cursor: "pointer", marginBottom: 4, background: selectedUser === username ? `${accent}22` : "transparent", border: `1px solid ${selectedUser === username ? accent : "transparent"}`, transition: "all 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", color: "#fff", fontWeight: 700, flexShrink: 0 }}>{username[0].toUpperCase()}</div>
                    <div><div style={{ fontSize: "0.85rem", fontWeight: 600, color: c.text }}>{username}</div><div style={{ fontSize: "0.7rem", color: c.muted }}>{msgs} messages</div></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {!selectedUser ? (
              <div>
                <div style={{ fontSize: "0.78rem", color: c.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Overview</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                  {[{ label: "Total Users", value: allUsers.length, icon: "👥", color: accent }, { label: "Total Messages", value: totalMsgs, icon: "💬", color: accent2 }, { label: "New Today", value: allUsers.filter(([, u]) => new Date(u.createdAt).toDateString() === new Date().toDateString()).length, icon: "🆕", color: "#10b981" }].map(({ label, value, icon, color }) => (
                    <div key={label} style={{ background: `${color}15`, borderRadius: 14, padding: "16px", border: `1px solid ${color}30` }}>
                      <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: c.text, fontWeight: 700 }}>{value}</div>
                      <div style={{ fontSize: "0.72rem", color: c.muted, marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {chartData.length > 0 && <div style={{ background: c.card, borderRadius: 16, padding: "20px", border: `1px solid ${c.border}` }}><BarChart data={chartData} color={accent} label="Messages per User" /></div>}
                <div style={{ fontSize: "0.85rem", color: c.muted, marginTop: 16, textAlign: "center" }}>← Select a user to view details</div>
              </div>
            ) : (() => {
              const userSessions = getUserSessions(selectedUser);
              const allMsgs = Object.values(userSessions).flatMap(s => s.messages);
              const tokens = allMsgs.reduce((a, m) => a + estimateTokens(m.content), 0);
              const sessionChart = Object.values(userSessions).slice(0, 8).map(s => ({ label: s.title.slice(0, 5), value: s.messages.length }));
              return (
                <div style={{ animation: "fadeUp 0.2s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#fff", fontWeight: 700 }}>{selectedUser[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: c.text }}>{selectedUser}</div>
                      <div style={{ fontSize: "0.75rem", color: c.muted }}>Joined {users[selectedUser]?.createdAt ? formatDate(users[selectedUser].createdAt) : "Unknown"}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[{ label: "Chats", value: Object.keys(userSessions).length, icon: "📁" }, { label: "Messages", value: allMsgs.length, icon: "💬" }, { label: "Tokens", value: tokens.toLocaleString(), icon: "⚡" }, { label: "Images", value: allMsgs.filter(m => m.imageUrl).length, icon: "🖼️" }].map(({ label, value, icon }) => (
                      <div key={label} style={{ background: `${accent}15`, borderRadius: 12, padding: "12px 14px", border: `1px solid ${accent}25` }}>
                        <div style={{ fontSize: "1rem", marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: c.text, fontWeight: 700 }}>{value}</div>
                        <div style={{ fontSize: "0.68rem", color: c.muted }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {sessionChart.length > 0 && <div style={{ background: c.card, borderRadius: 14, padding: "16px", border: `1px solid ${c.border}`, marginBottom: 16 }}><BarChart data={sessionChart} color={accent} label="Messages per Conversation" /></div>}
                  <div style={{ fontSize: "0.72rem", color: c.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Conversations</div>
                  {Object.values(userSessions).sort((a, b) => b.createdAt - a.createdAt).map(s => (
                    <div key={s.id} style={{ background: c.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${c.border}`, cursor: "pointer", transition: "all 0.15s", marginBottom: 6 }}
                      onClick={() => setViewingChat(viewingChat === s.id ? null : s.id)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: "0.85rem", color: c.text, fontWeight: 500 }}>{s.title}</div>
                        <div style={{ fontSize: "0.72rem", color: c.muted }}>{s.messages.length} msgs · {formatDate(s.createdAt)}</div>
                      </div>
                      {viewingChat === s.id && s.messages.length > 0 && (
                        <div style={{ marginTop: 10, borderTop: `1px solid ${c.border}`, paddingTop: 10, maxHeight: 200, overflowY: "auto" }}>
                          {s.messages.slice(0, 10).map(m => (
                            <div key={m.id} style={{ fontSize: "0.78rem", color: m.role === "user" ? accent2 : c.muted, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600 }}>{m.role === "user" ? "User" : "AI"}: </span>{m.content.slice(0, 120)}{m.content.length > 120 ? "…" : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartsDashboard({ sessions, dark, accent, accent2, totalMessages, totalTokens, onClose }) {
  const c = { surface: dark ? "#161628" : "#fff", card: dark ? "#1e1e2e" : "#f5f5f7", border: dark ? "#2a2a40" : "#e8e8f0", text: dark ? "#e8e6f0" : "#1a1a2e", muted: dark ? "#666680" : "#9090a0" };
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString([], { weekday: "short" }), value: Object.values(sessions).flatMap(s => s.messages).filter(m => new Date(m.ts).toDateString() === d.toDateString()).length };
  });
  const allMsgs = Object.values(sessions).flatMap(s => s.messages);
  const userMsgs = allMsgs.filter(m => m.role === "user").length;
  const aiMsgs = allMsgs.filter(m => m.role === "assistant").length;
  const imgMsgs = allMsgs.filter(m => m.imageUrl).length;
  const todayMsgs = allMsgs.filter(m => new Date(m.ts).toDateString() === new Date().toDateString()).length;
  const sessionData = Object.values(sessions).slice(0, 6).map(s => ({ label: s.title.slice(0, 5), value: s.messages.length }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }}>
      <div style={{ background: c.surface, borderRadius: 24, width: "90vw", maxWidth: 800, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", border: `1px solid ${c.border}`, animation: "fadeUp 0.3s ease" }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${accent}22, ${accent2}11)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>📊</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: c.text }}>Usage Dashboard</div>
              <div style={{ fontSize: "0.72rem", color: c.muted }}>Your Aura AI statistics</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${c.border}`, background: "transparent", color: c.muted, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[{ label: "Total Messages", value: totalMessages, icon: "💬", color: accent }, { label: "Est. Tokens", value: totalTokens.toLocaleString(), icon: "⚡", color: accent2 }, { label: "Conversations", value: Object.keys(sessions).length, icon: "📁", color: "#10b981" }, { label: "Today", value: todayMsgs, icon: "📅", color: "#f59e0b" }].map(({ label, value, icon, color }) => (
              <div key={label} style={{ background: `${color}15`, borderRadius: 16, padding: "16px 18px", border: `1px solid ${color}30` }}>
                <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: c.text, fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: "0.72rem", color: c.muted, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: c.card, borderRadius: 16, padding: "20px", border: `1px solid ${c.border}` }}>
              <BarChart data={last7} color={accent} label="Messages — Last 7 Days" />
            </div>
            <div style={{ background: c.card, borderRadius: 16, padding: "20px", border: `1px solid ${c.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: "0.68rem", color: c.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Message Types</div>
              <DonutChart segments={[{ value: userMsgs, color: accent }, { value: aiMsgs, color: accent2 }, { value: imgMsgs, color: "#10b981" }]} size={90} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.72rem", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: accent }}>● You</span><span style={{ color: c.muted }}>{userMsgs}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: accent2 }}>● Aura</span><span style={{ color: c.muted }}>{aiMsgs}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#10b981" }}>● Images</span><span style={{ color: c.muted }}>{imgMsgs}</span></div>
              </div>
            </div>
          </div>
          {sessionData.length > 0 && <div style={{ background: c.card, borderRadius: 16, padding: "20px", border: `1px solid ${c.border}` }}><BarChart data={sessionData} color={accent2} label="Messages per Conversation" /></div>}
        </div>
      </div>
    </div>
  );
}

export default function AuraAI() {
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem("aura_users") || "{}"));
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("aura_current_user") || null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [dark, setDark] = useState(true);
  const [themeName, setThemeName] = useState("purple");
  const [sessions, setSessions] = useState({});
  const [activeSession, setActiveSession] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("You are Aura, a brilliant and eloquent AI assistant. Be helpful, concise, and thoughtful.");
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showWebSum, setShowWebSum] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [webLoading, setWebLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [latestMsgId, setLatestMsgId] = useState(null);
  const [typingDone, setTypingDone] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const theme = THEMES[themeName];
  const { accent, accent2 } = theme;

  useEffect(() => { localStorage.setItem("aura_users", JSON.stringify(users)); }, [users]);
  useEffect(() => { if (currentUser) localStorage.setItem("aura_current_user", currentUser); else localStorage.removeItem("aura_current_user"); }, [currentUser]);
  useEffect(() => {
    if (!currentUser) return;
    const saved = JSON.parse(localStorage.getItem(`aura_sessions_${currentUser}`) || "{}");
    if (Object.keys(saved).length === 0) { const id = generateId(); setSessions({ [id]: { id, title: "New Chat", messages: [], createdAt: Date.now() } }); setActiveSession(id); }
    else { setSessions(saved); setActiveSession(Object.keys(saved)[0]); }
  }, [currentUser]);
  useEffect(() => {
    if (!currentUser || Object.keys(sessions).length === 0) return;
    localStorage.setItem(`aura_sessions_${currentUser}`, JSON.stringify(sessions));
    let msgs = 0, toks = 0;
    Object.values(sessions).forEach(s => { msgs += s.messages.length; s.messages.forEach(m => { toks += estimateTokens(m.content); }); });
    setTotalMessages(msgs); setTotalTokens(toks);
  }, [sessions, currentUser]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessions, loading]);

  const currentMessages = activeSession ? (sessions[activeSession]?.messages || []) : [];
  const c = { bg: dark ? theme.darkBg : "#f8f8fc", sidebar: dark ? theme.darkSurface : "#ffffff", surface: dark ? theme.darkSurface : "#ffffff", card: dark ? theme.darkCard : "#f5f5f7", border: dark ? "#2a2a40" : "#e8e8f0", text: dark ? "#e8e6f0" : "#1a1a2e", muted: dark ? "#666680" : "#9090a0", accentLight: dark ? `${accent}22` : `${accent}11` };

  const handleAuth = () => {
    const { username, password } = authForm;
    if (!username.trim() || !password.trim()) { setAuthError("Please fill all fields."); return; }
    if (authMode === "register") { if (users[username]) { setAuthError("Username taken."); return; } setUsers(u => ({ ...u, [username]: { password, createdAt: Date.now() } })); setCurrentUser(username); }
    else { if (!users[username] || users[username].password !== password) { setAuthError("Invalid credentials."); return; } setCurrentUser(username); }
    setAuthError("");
  };

  const newSession = () => { const id = generateId(); setSessions(s => ({ ...s, [id]: { id, title: "New Chat", messages: [], createdAt: Date.now() } })); setActiveSession(id); };
  const deleteSession = (id) => {
    setSessions(s => { const n = { ...s }; delete n[id]; return n; });
    if (activeSession === id) { const rem = Object.keys(sessions).filter(k => k !== id); setActiveSession(rem[0] || null); if (rem.length === 0) newSession(); }
  };
  const updateSessionTitle = (id, messages) => { if (messages.length === 1) { const title = messages[0].content.slice(0, 40) + (messages[0].content.length > 40 ? "…" : ""); setSessions(s => ({ ...s, [id]: { ...s[id], title } })); } };
  const handleReact = (msgId, emoji) => { setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: s[activeSession].messages.map(m => m.id === msgId ? { ...m, reactions: [...(m.reactions || []), emoji] } : m) } })); };

  const sendMessage = async () => {
    const text = input.trim(); if (!text || loading || !typingDone) return; setInput("");
    const userMsg = { id: generateId(), role: "user", content: text, ts: Date.now() };
    const updatedMessages = [...currentMessages, userMsg];
    setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: updatedMessages } }));
    updateSessionTitle(activeSession, updatedMessages); setLoading(true); setTypingDone(false);
    try {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "system", content: systemPrompt }, ...updatedMessages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))] }) });
      const data = await res.json();
      const fullText = data?.choices?.[0]?.message?.content || data?.error?.message || "I couldn't process that — please try again.";
      const aiMsg = { id: generateId(), role: "assistant", content: fullText, ts: Date.now() };
      setLatestMsgId(aiMsg.id); setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: [...updatedMessages, aiMsg] } }));
    } catch { const errMsg = { id: generateId(), role: "assistant", content: "⚠️ Network error.", ts: Date.now() }; setLatestMsgId(errMsg.id); setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: [...updatedMessages, errMsg] } })); }
    finally { setLoading(false); }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return; setImageLoading(true);
    const userMsg = { id: generateId(), role: "user", content: `🎨 Generate: ${imagePrompt}`, ts: Date.now() };
    const updatedMessages = [...currentMessages, userMsg];
    setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: updatedMessages } }));
    updateSessionTitle(activeSession, updatedMessages);
    try {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=768&height=512&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
      await new Promise((res, rej) => { const img = new Image(); img.onload = res; img.onerror = rej; img.src = imageUrl; });
      const aiMsg = { id: generateId(), role: "assistant", content: `Here's your image: "${imagePrompt}"`, imageUrl, ts: Date.now() };
      setLatestMsgId(aiMsg.id); setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: [...updatedMessages, aiMsg] } }));
      setImagePrompt(""); setShowImageGen(false);
    } catch { const e = { id: generateId(), role: "assistant", content: "⚠️ Could not generate image.", ts: Date.now() }; setLatestMsgId(e.id); setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: [...updatedMessages, e] } })); }
    finally { setImageLoading(false); setTypingDone(true); }
  };

  const summarizeWebsite = async () => {
    if (!webUrl.trim()) return; setWebLoading(true); setTypingDone(false);
    const userMsg = { id: generateId(), role: "user", content: `🌐 Summarize: ${webUrl}`, ts: Date.now() };
    const updatedMessages = [...currentMessages, userMsg];
    setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: updatedMessages } }));
    updateSessionTitle(activeSession, updatedMessages);
    try {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "system", content: "You are a helpful assistant that summarizes websites. Given a URL, provide a detailed summary of what the website is about, its purpose, key features, and content." }, { role: "user", content: `Summarize: ${webUrl}` }] }) });
      const data = await res.json();
      const fullText = data?.choices?.[0]?.message?.content || "Could not summarize.";
      const aiMsg = { id: generateId(), role: "assistant", content: fullText, ts: Date.now() };
      setLatestMsgId(aiMsg.id); setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: [...updatedMessages, aiMsg] } }));
      setWebUrl(""); setShowWebSum(false);
    } catch { const e = { id: generateId(), role: "assistant", content: "⚠️ Could not summarize.", ts: Date.now() }; setLatestMsgId(e.id); setSessions(s => ({ ...s, [activeSession]: { ...s[activeSession], messages: [...updatedMessages, e] } })); }
    finally { setWebLoading(false); }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Voice not supported."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR(); rec.onresult = e => setInput(v => v + e.results[0][0].transcript); rec.onend = () => setListening(false); rec.start(); recognitionRef.current = rec; setListening(true);
  };

  const exportAsText = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([currentMessages.map(m => `[${m.role === "user" ? "You" : "Aura"}] ${formatTime(m.ts)}\n${m.content}`).join("\n\n---\n\n")], { type: "text/plain" })); a.download = `aura-chat-${Date.now()}.txt`; a.click(); };
  const exportAsPDF = () => { const w = window.open("", "_blank"); w.document.write(`<html><head><title>Aura Chat</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a2e}.msg{margin-bottom:2rem;padding:1rem;border-radius:8px}.user{background:#f0f0ff}.assistant{background:#f9f9f9}.label{font-weight:bold;font-size:0.8rem;color:#666;margin-bottom:6px}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><h1>✦ Aura AI Chat Export</h1>${currentMessages.map(m => `<div class="msg ${m.role}"><div class="label">${m.role === "user" ? "You" : "Aura"} · ${formatTime(m.ts)}</div><pre>${m.content}</pre></div>`).join("")}</body></html>`); w.document.close(); w.print(); };

  if (!currentUser) {
    return (
      <>
        <style>{FONTS}{`@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{50%{opacity:0}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
        <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${theme.darkBg} 0%, ${theme.darkCard} 50%, #0d1a2e 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, top: "10%", left: "20%", pointerEvents: "none" }} />
          <div style={{ position: "fixed", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${accent2}22 0%, transparent 70%)`, bottom: "15%", right: "15%", pointerEvents: "none" }} />
          <div style={{ animation: "fadeUp 0.6s ease", background: theme.darkSurface, borderRadius: 24, padding: "48px 40px", width: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.5)", border: "1px solid #2a2a40" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>✦</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#e8e6f0" }}>Aura AI</h1>
              <p style={{ color: "#666680", fontSize: "0.88rem", marginTop: 6 }}>Your intelligent companion</p>
            </div>
            <div style={{ display: "flex", background: "#0d0d1a", borderRadius: 12, padding: 4, marginBottom: 28 }}>
              {["login", "register"].map(m => <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.88rem", transition: "all 0.2s", background: authMode === m ? accent : "transparent", color: authMode === m ? "#fff" : "#666680" }}>{m === "login" ? "Sign In" : "Create Account"}</button>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["username", "password"].map(field => <input key={field} type={field === "password" ? "password" : "text"} placeholder={field === "username" ? "Username" : "Password"} value={authForm[field]} onChange={e => setAuthForm(f => ({ ...f, [field]: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleAuth()} style={{ padding: "13px 16px", borderRadius: 12, border: "1px solid #2a2a40", background: "#0d0d1a", color: "#e8e6f0", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none" }} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = "#2a2a40"} />)}
              {authError && <div style={{ color: "#f87171", fontSize: "0.82rem", textAlign: "center" }}>{authError}</div>}
              <button onClick={handleAuth} style={{ marginTop: 4, padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.95rem" }}>{authMode === "login" ? "Sign In →" : "Create Account →"}</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{FONTS}{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{50%{opacity:0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2a40;border-radius:4px}textarea{resize:none}`}</style>

      {showAdmin && <AdminPanel users={users} dark={dark} accent={accent} accent2={accent2} onClose={() => setShowAdmin(false)} />}
      {showDashboard && <ChartsDashboard sessions={sessions} dark={dark} accent={accent} accent2={accent2} totalMessages={totalMessages} totalTokens={totalTokens} onClose={() => setShowDashboard(false)} />}

      <div style={{ display: "flex", height: "100vh", background: c.bg, color: c.text, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", transition: "background 0.3s" }}>
        <div style={{ width: 260, background: c.sidebar, borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${c.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: "#fff", fontWeight: 700 }}>✦</div>
              <div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: c.text }}>Aura AI</div><div style={{ fontSize: "0.7rem", color: c.muted }}>@{currentUser}</div></div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.border}`, display: "flex", gap: 6 }}>
            {[{ icon: "🖼️", title: "Image Gen", action: () => { setShowImageGen(v => !v); setShowWebSum(false); } }, { icon: "🌐", title: "Web Summary", action: () => { setShowWebSum(v => !v); setShowImageGen(false); } }, { icon: "🎨", title: "Themes", action: () => setShowThemes(v => !v) }].map(({ icon, title, action }) => (
              <button key={title} onClick={action} title={title} style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", color: c.muted, cursor: "pointer", fontSize: "1rem", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = c.accentLight; e.currentTarget.style.borderColor = accent; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = c.border; }}>{icon}</button>
            ))}
          </div>
          {showThemes && (
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.border}`, animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontSize: "0.68rem", color: c.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Choose Theme</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(THEMES).map(([key, t]) => <button key={key} onClick={() => { setThemeName(key); setShowThemes(false); }} title={t.name} style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, border: themeName === key ? "3px solid white" : "3px solid transparent", cursor: "pointer", transition: "transform 0.15s", boxShadow: themeName === key ? `0 0 0 2px ${t.accent}` : "none" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />)}
              </div>
              <div style={{ fontSize: "0.72rem", color: c.muted, marginTop: 6 }}>{theme.name}</div>
            </div>
          )}
          <div style={{ padding: "8px 16px" }}>
            <button onClick={newSession} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px dashed ${c.border}`, background: "transparent", color: c.muted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent2; }} onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.muted; }}>
              <span>+</span> New conversation
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
            <div style={{ fontSize: "0.68rem", color: c.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 4px 6px" }}>Conversations</div>
            {Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt).map(s => (
              <div key={s.id} onClick={() => setActiveSession(s.id)} style={{ padding: "9px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between", background: activeSession === s.id ? c.accentLight : "transparent", borderLeft: activeSession === s.id ? `2px solid ${accent}` : "2px solid transparent", transition: "all 0.15s" }}>
                <div style={{ fontSize: "0.82rem", color: activeSession === s.id ? accent2 : c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{s.title}</div>
                <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }} style={{ opacity: 0, background: "none", border: "none", cursor: "pointer", color: c.muted, fontSize: "0.8rem", padding: "0 2px" }} ref={r => { if (r) { r.parentElement.onmouseenter = () => r.style.opacity = "1"; r.parentElement.onmouseleave = () => r.style.opacity = "0"; } }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${c.border}`, display: "flex", flexDirection: "column", gap: 2 }}>
            {[{ icon: "📊", label: "Dashboard", action: () => setShowDashboard(true) }, { icon: "👑", label: "Admin Panel", action: () => setShowAdmin(true) }, { icon: "⚙️", label: "Settings", action: () => setShowSettings(v => !v) }, { icon: "↗️", label: "Export Chat", action: () => setShowExport(v => !v) }, { icon: "🚪", label: "Sign Out", action: () => setCurrentUser(null) }].map(({ icon, label, action }) => (
              <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none", background: "transparent", color: c.muted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem", textAlign: "left", transition: "all 0.15s", width: "100%" }} onMouseEnter={e => { e.currentTarget.style.background = c.accentLight; e.currentTarget.style.color = accent2; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.muted; }}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: 60, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: c.surface, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: c.text }}>{sessions[activeSession]?.title || "New Chat"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: "0.75rem", color: c.muted, background: c.accentLight, padding: "4px 10px", borderRadius: 20, fontFamily: "'JetBrains Mono', monospace" }}>~{totalTokens.toLocaleString()} tokens</div>
              <button onClick={() => setDark(v => !v)} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", color: c.text, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = c.accentLight} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{dark ? "☀️" : "🌙"}</button>
            </div>
          </div>

          {showImageGen && (
            <div style={{ padding: "16px 24px", background: c.surface, borderBottom: `1px solid ${c.border}`, animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontSize: "0.78rem", color: c.muted, marginBottom: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>🖼️ AI Image Generation</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && generateImage()} placeholder="Describe your image…" style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: `1px solid ${c.border}`, background: dark ? "#0d0d1a" : "#f5f5f7", color: c.text, fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", outline: "none" }} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = c.border} />
                <button onClick={generateImage} disabled={imageLoading || !imagePrompt.trim()} style={{ padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.85rem", opacity: imagePrompt.trim() && !imageLoading ? 1 : 0.5, whiteSpace: "nowrap" }}>{imageLoading ? "Generating…" : "✨ Generate"}</button>
              </div>
            </div>
          )}
          {showWebSum && (
            <div style={{ padding: "16px 24px", background: c.surface, borderBottom: `1px solid ${c.border}`, animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontSize: "0.78rem", color: c.muted, marginBottom: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>🌐 Website Summarizer</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={webUrl} onChange={e => setWebUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && summarizeWebsite()} placeholder="Paste any URL…" style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: `1px solid ${c.border}`, background: dark ? "#0d0d1a" : "#f5f5f7", color: c.text, fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", outline: "none" }} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = c.border} />
                <button onClick={summarizeWebsite} disabled={webLoading || !webUrl.trim()} style={{ padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.85rem", opacity: webUrl.trim() && !webLoading ? 1 : 0.5, whiteSpace: "nowrap" }}>{webLoading ? "Reading…" : "🌐 Summarize"}</button>
              </div>
            </div>
          )}
          {showSettings && (
            <div style={{ padding: "20px 24px", background: c.surface, borderBottom: `1px solid ${c.border}`, animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontSize: "0.78rem", color: c.muted, marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Custom AI Personality</div>
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={3} style={{ width: "100%", background: dark ? "#0d0d1a" : "#f5f5f7", border: `1px solid ${c.border}`, borderRadius: 12, padding: "12px 14px", color: c.text, fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", lineHeight: 1.6, outline: "none" }} />
            </div>
          )}
          {showExport && (
            <div style={{ padding: "16px 24px", background: c.surface, borderBottom: `1px solid ${c.border}`, display: "flex", gap: 12, animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontSize: "0.78rem", color: c.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginRight: 8, alignSelf: "center" }}>Export:</div>
              {[{ label: "📄 PDF", action: exportAsPDF }, { label: "📝 Text", action: exportAsText }].map(({ label, action }) => (
                <button key={label} onClick={action} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", color: c.text, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = accent; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.text; e.currentTarget.style.borderColor = c.border; }}>{label}</button>
              ))}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 4 }}>
            {currentMessages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeUp 0.5s ease" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.3 }}>✦</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: c.text, marginBottom: 8, opacity: 0.7 }}>How can I help you today?</div>
                <div style={{ fontSize: "0.85rem", color: c.muted, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>Chat · Images · Web Summary · Dashboard · Admin</div>
                <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
                  {["✍️ Write a poem about the stars", "🖼️ A dragon flying over mountains", "🌐 https://github.com", "💡 Explain black holes simply"].map(p => (
                    <button key={p} onClick={() => { if (p.startsWith("🖼️")) { setImagePrompt(p.slice(3)); setShowImageGen(true); } else if (p.startsWith("🌐")) { setWebUrl(p.slice(3)); setShowWebSum(true); } else setInput(p.slice(3)); }} style={{ padding: "9px 16px", borderRadius: 20, border: `1px solid ${c.border}`, background: "transparent", color: c.muted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent2; }} onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.muted; }}>{p}</button>
                  ))}
                </div>
              </div>
            )}
            {currentMessages.map((msg, i) => (
              <div key={msg.id} style={{ animation: i === currentMessages.length - 1 ? "fadeUp 0.3s ease" : "none" }}>
                <MessageBubble msg={msg} dark={dark} onReact={handleReact} isLatest={msg.id === latestMsgId} onTypeDone={() => setTypingDone(true)} accent={accent} accent2={accent2} />
              </div>
            ))}
            {(loading || imageLoading || webLoading) && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#fff" }}>✦</div>
                <div style={{ display: "flex", gap: 5 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: accent, animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}</div>
                <div style={{ fontSize: "0.78rem", color: c.muted }}>{imageLoading ? "Generating image…" : webLoading ? "Reading website…" : "Thinking…"}</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "16px 24px 20px", background: c.surface, borderTop: `1px solid ${c.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: dark ? "#0d0d1a" : "#f5f5f7", borderRadius: 18, padding: "10px 14px", border: `1px solid ${c.border}`, transition: "border-color 0.2s" }} onFocusCapture={e => e.currentTarget.style.borderColor = accent} onBlurCapture={e => e.currentTarget.style.borderColor = c.border}>
              <button onClick={toggleVoice} style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", background: listening ? `${accent}22` : "transparent", color: listening ? accent2 : c.muted, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: listening ? "pulse 1s infinite" : "none" }}>🎤</button>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Message Aura… (Shift+Enter for newline)" rows={1} style={{ flex: 1, background: "transparent", border: "none", color: c.text, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", lineHeight: 1.6, maxHeight: 120, overflowY: "auto", paddingTop: 6, outline: "none" }} />
              <div style={{ fontSize: "0.68rem", color: c.muted, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, paddingBottom: 2 }}>~{estimateTokens(input)}t</div>
              <button onClick={sendMessage} disabled={loading || !input.trim() || !typingDone} style={{ width: 36, height: 36, borderRadius: 11, border: "none", cursor: input.trim() && !loading && typingDone ? "pointer" : "not-allowed", background: input.trim() && !loading && typingDone ? `linear-gradient(135deg, ${accent}, ${accent2})` : (dark ? "#2a2a40" : "#e0e0e8"), color: "#fff", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", opacity: input.trim() && !loading && typingDone ? 1 : 0.4 }}>
                {loading ? <div style={{ width: 14, height: 14, border: "2px solid #ffffff44", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : "↑"}
              </button>
            </div>
            <div style={{ fontSize: "0.7rem", color: c.muted, textAlign: "center", marginTop: 10 }}>Aura AI · Groq LLaMA 3.3 · 🖼️ Images · 🌐 Web · 🎨 6 Themes · 📊 Charts · 👑 Admin</div>
          </div>
        </div>
      </div>
    </>
  );
}
