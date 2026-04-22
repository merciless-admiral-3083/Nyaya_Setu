"use client";

import { useEffect, useState } from "react";
import { PageWrap, SiteFooter, SiteHeader } from "../components/SiteShell";

const emojiOptions = ["⚖️", "🪷", "🧠", "📜", "🛡️", "🔍", "✨", "📘"];
const colorOptions = ["#e8762d", "#1a2b4a", "#f5b942", "#7a4f2a", "#3b6ea8"];

async function fetchJson(path, options) {
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }
  return payload;
}

export default function AccountPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    avatar: "⚖️",
    bio: "",
    themeColor: "#e8762d",
    emojiPack: ["⚖️", "🧠", "📜", "🛡️"],
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const sessionPayload = await fetchJson("/api/auth/session", { cache: "no-store" });
        if (!active) return;

        setSession(sessionPayload.user || null);

        if (sessionPayload.user) {
          const [profilePayload, historyPayload] = await Promise.all([
            fetchJson("/api/account/profile", { cache: "no-store" }),
            fetchJson("/api/account/history", { cache: "no-store" }),
          ]);

          if (!active) return;
          setProfile(profilePayload.user || null);
          setHistory(historyPayload.analyses || []);
          setInsights(historyPayload.insights || null);
          setForm((current) => ({
            ...current,
            name: profilePayload.user?.name || current.name,
            avatar: profilePayload.user?.avatar || current.avatar,
            bio: profilePayload.user?.bio || current.bio,
            themeColor: profilePayload.user?.themeColor || current.themeColor,
            emojiPack: profilePayload.user?.emojiPack || current.emojiPack,
          }));
        }
      } catch (error) {
        if (active) {
          setMessage(error.message || "Could not load account data.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    try {
      const payload = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      setSession(payload.user);
      setProfile(payload.user);
      setMessage(`Welcome back, ${payload.user.name}.`);
      setForm((current) => ({ ...current, password: "", name: payload.user.name, avatar: payload.user.avatar, bio: payload.user.bio, themeColor: payload.user.themeColor, emojiPack: payload.user.emojiPack }));
      const historyPayload = await fetchJson("/api/account/history", { cache: "no-store" });
      setHistory(historyPayload.analyses || []);
      setInsights(historyPayload.insights || null);
    } catch (error) {
      setMessage(error.message || "Login failed.");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");

    try {
      const payload = await fetchJson("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, name: form.name, password: form.password }),
      });

      setSession(payload.user);
      setProfile(payload.user);
      setMessage(`Account created for ${payload.user.name}.`);
      setForm((current) => ({ ...current, password: "", avatar: payload.user.avatar, bio: payload.user.bio, themeColor: payload.user.themeColor, emojiPack: payload.user.emojiPack }));
    } catch (error) {
      setMessage(error.message || "Registration failed.");
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();

    try {
      const payload = await fetchJson("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          avatar: form.avatar,
          bio: form.bio,
          themeColor: form.themeColor,
          emojiPack: form.emojiPack,
        }),
      });

      setProfile(payload.user);
      setSession(payload.user);
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error.message || "Could not update profile.");
    }
  }

  async function handleLogout() {
    await fetchJson("/api/auth/logout", { method: "POST" });
    setSession(null);
    setProfile(null);
    setHistory([]);
    setInsights(null);
    setMessage("Logged out.");
  }

  function toggleEmoji(emoji) {
    setForm((current) => {
      const exists = current.emojiPack.includes(emoji);
      const emojiPack = exists ? current.emojiPack.filter((item) => item !== emoji) : [...current.emojiPack, emoji];
      return { ...current, emojiPack: emojiPack.slice(0, 6) };
    });
  }

  const loggedIn = Boolean(session);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1 py-12">
        <PageWrap>
          <section className="mb-6 reveal">
            <p className="kicker">Account</p>
            <h1 className="font-title mt-2 text-4xl text-[color:var(--navy)]">Your legal workspace</h1>
            <p className="mt-2 max-w-3xl text-[color:var(--ink)]/80">Sign in to keep analysis history, see the clauses you usually skip, and personlize the account with your own emoji and colors.</p>
          </section>

          {message ? <p className="mb-4 rounded-2xl bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)] shadow-sm">{message}</p> : null}

          {!loggedIn ? (
            <section className="grid gap-6 md:grid-cols-2">
              <form className="panel rounded-3xl p-6" onSubmit={handleLogin}>
                <h2 className="font-title text-2xl text-[color:var(--navy)]">Login</h2>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-xl border border-[color:var(--navy)]/15 bg-white px-4 py-3 text-sm" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                  <input className="w-full rounded-xl border border-[color:var(--navy)]/15 bg-white px-4 py-3 text-sm" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
                  <button className="rounded-full bg-[color:var(--navy)] px-5 py-2 text-sm font-semibold text-white" type="submit">Login</button>
                </div>
              </form>

              <form className="panel rounded-3xl p-6" onSubmit={handleRegister}>
                <h2 className="font-title text-2xl text-[color:var(--navy)]">Register</h2>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-xl border border-[color:var(--navy)]/15 bg-white px-4 py-3 text-sm" placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                  <input className="w-full rounded-xl border border-[color:var(--navy)]/15 bg-white px-4 py-3 text-sm" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                  <input className="w-full rounded-xl border border-[color:var(--navy)]/15 bg-white px-4 py-3 text-sm" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
                  <button className="rounded-full bg-[color:var(--saffron)] px-5 py-2 text-sm font-semibold text-white" type="submit">Create Account</button>
                </div>
              </form>
            </section>
          ) : (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="panel drift-in rounded-3xl p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: `${profile?.themeColor || form.themeColor}22`, color: profile?.themeColor || form.themeColor }}>
                    {profile?.avatar || form.avatar}
                  </div>
                  <div>
                    <p className="kicker">Signed in</p>
                    <h2 className="font-title text-2xl text-[color:var(--navy)]">{profile?.name || session?.name}</h2>
                    <p className="text-sm text-[color:var(--ink)]/70">{session?.email}</p>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleProfileSave}>
                  <input className="w-full rounded-xl border border-[color:var(--navy)]/15 bg-white px-4 py-3 text-sm" placeholder="Display name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                  <div className="grid grid-cols-4 gap-2">
                    {emojiOptions.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setForm((current) => ({ ...current, avatar: emoji }))} className={`rounded-xl border px-3 py-2 text-xl ${form.avatar === emoji ? "border-[color:var(--saffron)] bg-white" : "border-[color:var(--navy)]/15 bg-white/70"}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <textarea className="min-h-24 w-full rounded-xl border border-[color:var(--navy)]/15 bg-white px-4 py-3 text-sm" placeholder="Bio" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button key={color} type="button" onClick={() => setForm((current) => ({ ...current, themeColor: color }))} className={`size-10 rounded-full border-2 ${form.themeColor === color ? "border-white shadow-lg" : "border-transparent"}`} style={{ backgroundColor: color }} aria-label={`Set theme ${color}`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => toggleEmoji(emoji)} className={`rounded-full px-3 py-1 text-sm ${form.emojiPack.includes(emoji) ? "bg-[color:var(--navy)] text-white" : "bg-white text-[color:var(--navy)]"}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button className="rounded-full bg-[color:var(--saffron)] px-5 py-2 text-sm font-semibold text-white" type="submit">Save Profile</button>
                  <button className="rounded-full border border-[color:var(--navy)]/20 bg-white px-5 py-2 text-sm text-[color:var(--navy)]" type="button" onClick={handleLogout}>Logout</button>
                </form>
              </article>

              <article className="space-y-5">
                <div className="panel rounded-3xl p-6">
                  <h2 className="font-title text-2xl text-[color:var(--navy)]">History</h2>
                  <p className="mt-1 text-sm text-[color:var(--ink)]/75">Your latest accessed documents and verdicts.</p>
                  <div className="mt-4 space-y-3">
                    {isLoading ? <p className="text-sm text-[color:var(--ink)]/65">Loading history...</p> : null}
                    {!isLoading && history.length === 0 ? <p className="text-sm text-[color:var(--ink)]/65">No saved analyses yet.</p> : null}
                    {history.map((item) => (
                      <div key={item._id || item.analysisId} className="tilt-hover rounded-2xl border border-[color:var(--navy)]/15 bg-white/80 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[color:var(--navy)]">{item.recommendation}</p>
                          <span className="pulse-soft rounded-full bg-[color:var(--navy)] px-2 py-1 text-xs text-white">{item.riskScore}/10</span>
                        </div>
                        <p className="mt-2 text-[color:var(--ink)]/75">{item.documentPreview}</p>
                        <p className="mt-2 text-xs text-[color:var(--ink)]/55">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Recently"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="panel rounded-3xl p-6">
                    <h3 className="font-title text-xl text-[color:var(--navy)]">Ignored often</h3>
                    <div className="mt-3 space-y-2">
                      {insights?.ignoredPatterns?.map((item) => (
                        <div key={item.text} className="rounded-xl bg-white/80 px-3 py-2 text-sm">
                          <p>{item.text}</p>
                          <p className="text-xs text-[color:var(--ink)]/55">{item.label} · {item.count} times</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel rounded-3xl p-6">
                    <h3 className="font-title text-xl text-[color:var(--navy)]">Recurring terms</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {insights?.recurringTerms?.map((item) => (
                        <span key={item.term} className="rounded-full bg-[color:var(--navy)] px-3 py-1 text-xs text-white">{item.term} · {item.count}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </section>
          )}
        </PageWrap>
      </main>
      <SiteFooter />
    </div>
  );
}
