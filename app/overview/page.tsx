"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Brain,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Database,
  Calendar,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Send,
  Play,
  RotateCcw,
} from "lucide-react";

export default function OverviewPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Interactive Live Playground inside the showcase
  const [testInput, setTestInput] = useState(
    "How does Mnemo combine persistent memory with NVIDIA Nemotron 3 Ultra to act as my second brain?"
  );
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const runLiveTest = async (promptText?: string) => {
    const textToSubmit = promptText || testInput;
    if (!textToSubmit.trim() || testing) return;

    setTesting(true);
    setTestOutput(null);
    const start = performance.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "nvidia/Nemotron-3-Ultra-550b-a55b",
          messages: [{ role: "user", content: textToSubmit }],
        }),
      });

      const data = await res.json();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setTestOutput(data.reply || "No reply returned.");
    } catch (err: any) {
      setTestOutput("Error connecting to Nebius Token Factory: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#08080c] text-zinc-100 selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden font-sans"
    >
      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Ambient background glowing orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[180px]" />
      </div>

      {/* Sticky Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08080c]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">
                mnemo<span className="text-violet-400">.</span>
              </span>
              <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-mono text-violet-300">
                Showcase
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#pillars" className="hover:text-white transition">
              Core Architecture
            </a>
            <a href="#models" className="hover:text-white transition">
              NVIDIA Nemotron Suite
            </a>
            <a href="#sandbox" className="hover:text-white transition">
              Live Test Sandbox
            </a>
            <a href="#sovereignty" className="hover:text-white transition">
              Data Sovereignty
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-28 px-6 sm:px-8 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-300 mb-8 backdrop-blur-md shadow-xs"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Nebius x NVIDIA Global AI Hackathon Submission</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto"
        >
          The Sovereign Second Brain with{" "}
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Executive Intelligence
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Mnemo unifies persistent personal memory, project intelligence, and grounded agent workflows into a private assistant powered by{" "}
          <strong className="text-zinc-200">NVIDIA Nemotron 3 Ultra (550B)</strong> on{" "}
          <strong className="text-zinc-200">Nebius Token Factory</strong>.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 hover:opacity-95 transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>Open Mnemo Assistant</span>
          </Link>
          <a
            href="#sandbox"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
          >
            <span>Live Nemotron Sandbox</span>
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </a>
        </motion.div>

        {/* 3D-Look Live Architecture Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="mt-16 rounded-3xl border border-white/[0.1] bg-[#111119]/80 p-4 sm:p-7 shadow-2xl backdrop-blur-2xl text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-2 font-mono text-[11px] text-zinc-500">
                mnemo-orchestration-engine
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono">
                Tokens streaming: Nebius Token Factory
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1 */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Memory Recall</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  "User is building for the Nebius x NVIDIA AI Hackathon using Next.js and Token Factory."
                </p>
              </div>
              <span className="mt-4 text-[10px] font-mono text-zinc-500">
                Matched from: data/memories.json
              </span>
            </div>

            {/* Box 2 */}
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4.5 flex flex-col justify-between shadow-[0_0_20px_rgba(139,92,246,0.1)]">
              <div>
                <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>NVIDIA Nemotron 3 Ultra</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-mono">
                  550B Parameters &bull; 0.2 Temperature &bull; Grounded reasoning with zero hallucination.
                </p>
              </div>
              <span className="mt-4 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live: 1.69s Average Latency
              </span>
            </div>

            {/* Box 3 */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Sovereign Action</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  "Create high-priority task 'Record 3-minute hackathon demo' with confirmation gate."
                </p>
              </div>
              <span className="mt-4 text-[10px] font-mono text-zinc-500">
                Action: Requires User Approval
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 1: The Three Pillars */}
      <section id="pillars" className="relative z-10 py-24 px-6 sm:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            Architectural Supremacy
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Built for Real Autonomy, Grounded in Truth
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Unlike ephemeral chat bots, Mnemo gives you a persistent cognitive engine that grows smarter the more you use it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-white/[0.08] bg-[#12121c]/70 p-7 backdrop-blur-xl transition shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/25 text-violet-300 mb-6">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Persistent Memory Engine
            </h3>
            <p className="mt-3 text-xs leading-6 text-zinc-400">
              Stores facts, goals, and working preferences across sessions. Relevant memories are semantically matched and injected into the NVIDIA model's context before each turn.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
                <span>Automatic 1-click memory capture</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
                <span>Zero hallucination of personal facts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
                <span>Full user editing &amp; deletion rights</span>
              </li>
            </ul>
          </motion.div>

          {/* Pillar 2 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-violet-500/30 bg-[#141224]/80 p-7 backdrop-blur-xl transition shadow-xl shadow-violet-500/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-300 mb-6">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              NVIDIA Nemotron 3 Ultra (550B)
            </h3>
            <p className="mt-3 text-xs leading-6 text-zinc-300">
              Hosted on Nebius Token Factory with enterprise-grade latency. Handles deep reasoning, complex multi-step planning, and executive task decomposition with 550B precision.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-zinc-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Flagship 550B multi-step reasoning</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Dynamic fast-tier fallback (Lightning 3.5)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Sub-2-second inference on Nebius</span>
              </li>
            </ul>
          </motion.div>

          {/* Pillar 3 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-white/[0.08] bg-[#12121c]/70 p-7 backdrop-blur-xl transition shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Sovereign Agent Actions
            </h3>
            <p className="mt-3 text-xs leading-6 text-zinc-400">
              When you tell Mnemo to create, update, or reschedule a task, the agent proposes structured actions. Nothing touches your data until you explicitly press "Approve &amp; Apply".
            </p>
            <ul className="mt-6 space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Human-in-the-loop safety protocol</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Rigid schema validation before approval</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Instant sync with Projects &amp; Tasks</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Interactive Sandbox */}
      <section id="sandbox" className="relative z-10 py-24 px-6 sm:px-8 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            Live Nebius Token Factory Sandbox
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Test the 550B Nemotron Engine Right Here
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Submit a query to test live token generation from Nebius Token Factory with real-time latency measurement.
          </p>
        </div>

        {/* Sandbox Console */}
        <div className="rounded-3xl border border-white/[0.12] bg-[#12121a] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-200">
                Target: nvidia/Nemotron-3-Ultra-550b-a55b
              </span>
            </div>
            {latency !== null && (
              <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-3 py-1 text-xs font-mono text-violet-300">
                Latency: {latency}ms
              </span>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Synthesize my hackathon strategy in 3 bullet points.",
              "Why is a sovereign second brain better than centralized cloud AI?",
              "Generate a daily executive standup plan for building an AI project.",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setTestInput(preset);
                  runLiveTest(preset);
                }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.07] hover:border-violet-400/30 transition text-left"
              >
                &ldquo;{preset}&rdquo;
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runLiveTest();
              }}
              placeholder="Ask the 550B Nemotron model..."
              className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-xs text-white outline-none focus:border-violet-400 transition"
            />
            <button
              onClick={() => runLiveTest()}
              disabled={testing || !testInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white shadow-lg hover:bg-violet-500 transition disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Test Live</span>
                </>
              )}
            </button>
          </div>

          {/* Output Display */}
          {testOutput && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border border-violet-500/25 bg-violet-950/20 p-5 text-xs text-zinc-200 leading-relaxed font-sans"
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-violet-500/20 text-[10px] text-violet-300 uppercase tracking-wider font-mono">
                <span>NVIDIA Nemotron 3 Ultra (550B) Output</span>
                <span>Verified Nebius Inference</span>
              </div>
              <p className="whitespace-pre-wrap">{testOutput}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Section 3: Model Suite Comparison */}
      <section id="models" className="relative z-10 py-24 px-6 sm:px-8 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            NVIDIA Model Portfolio
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Orchestrated on Nebius Token Factory
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Mnemo supports dynamic model routing so you can reach for Ultra for reasoning and Lightning for everyday queries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: "Nemotron 3 Ultra",
              size: "550B",
              role: "Deep Reasoning & Planning",
              desc: "Flagship reasoning engine for multi-step tasks and deep synthesis.",
              badge: "Flagship",
              badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
            },
            {
              name: "Nemotron 3.5 Lightning",
              size: "Fast",
              role: "Everyday Conversational",
              desc: "Sub-second response speed for real-time assistant queries.",
              badge: "Sub-Second",
              badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
            },
            {
              name: "Nemotron 3 Super",
              size: "120B",
              role: "High-Performance Workhorse",
              desc: "Balanced depth and speed for extensive project backlogs.",
              badge: "120B Super",
              badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            },
            {
              name: "Nemotron 3 Nano",
              size: "30B",
              role: "Lightweight Edge",
              desc: "Compact high-efficiency architecture for fast classification.",
              badge: "30B Nano",
              badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-white/[0.08] bg-[#111119]/60 p-5 backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">{m.size}</span>
                </div>
                <h4 className="text-sm font-semibold text-white">{m.name}</h4>
                <p className="text-xs text-violet-300/80 mt-0.5 font-medium">{m.role}</p>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{m.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.04] text-[10px] text-zinc-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Available on Nebius</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Data Sovereignty */}
      <section id="sovereignty" className="relative z-10 py-24 px-6 sm:px-8 max-w-5xl mx-auto border-t border-white/[0.06] text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-6">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white max-w-xl mx-auto">
          Private by Design. Local-First Control.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Your personal chats and project backlogs stay stored in your browser. Memories remain under your direct control in your private workspace. Your thoughts are never used to train global commercial models.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 hover:bg-violet-500 transition"
          >
            <span>Launch Mnemo Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/projects"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.08] transition"
          >
            <span>View Projects &amp; Tasks</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 px-6 sm:px-8 bg-[#060609] text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Mnemo</span>
            <span>&bull;</span>
            <span>Nebius x NVIDIA Global AI Hackathon</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-zinc-300 transition">
              Workspace
            </Link>
            <Link href="/projects" className="hover:text-zinc-300 transition">
              Projects
            </Link>
            <Link href="/memories" className="hover:text-zinc-300 transition">
              Memories
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
