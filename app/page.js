"use client";
import { useState } from "react";

function EdgeChart({ marketPrice, ourProbability }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">Market price vs our estimate</div>
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Market says</span>
            <span className="font-mono font-bold text-slate-300">{marketPrice}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-slate-500 rounded-full transition-all duration-1000" style={{ width: marketPrice + "%" }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-cyan-400">We estimate</span>
            <span className="font-mono font-bold text-cyan-400">{ourProbability}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: ourProbability + "%" }} />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="text-xs text-slate-400">Edge:</div>
          <div className="font-mono font-bold text-green-400 text-sm">+{ourProbability - marketPrice} points</div>
        </div>
      </div>
    </div>
  );
}

function PayoutChart({ payout, marketPrice }) {
  const cost = marketPrice;
  const profit = 100 - marketPrice;
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">Payout breakdown ($100 bet)</div>
      <div className="flex h-8 rounded-lg overflow-hidden mb-2">
        <div className="bg-slate-600 flex items-center justify-center text-xs font-mono font-bold" style={{ width: cost + "%" }}>${cost}</div>
        <div className="bg-green-500 flex items-center justify-center text-xs font-mono font-bold text-slate-900" style={{ width: profit + "%" }}>+${profit}</div>
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Your stake</span>
        <span className="text-green-400 font-semibold">{payout}</span>
      </div>
    </div>
  );
}

function PickCard({ pick, index }) {
  const sideColor = pick.side === "YES" ? "text-green-400 bg-green-900/30 border-green-800" : "text-red-400 bg-red-900/30 border-red-800";
  const confColor = pick.confidence >= 7 ? "text-green-400" : pick.confidence >= 5 ? "text-amber-400" : "text-red-400";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-cyan-400 text-slate-950 font-mono font-bold text-lg w-10 h-10 rounded-lg flex items-center justify-center shrink-0">{index + 1}</div>
            <div>
              <div className="font-semibold text-white text-base leading-snug">{pick.market}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={"px-3 py-1 rounded-full text-xs font-mono font-bold border " + sideColor}>BET {pick.side}</span>
                <span className={"font-mono text-sm font-bold " + confColor}>Confidence {pick.confidence}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EdgeChart marketPrice={pick.marketPrice} ourProbability={pick.ourProbability} />
          <PayoutChart payout={pick.payout} marketPrice={pick.marketPrice} />
        </div>

        <div className="bg-cyan-950/30 border border-cyan-900/40 rounded-lg p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Why this is a smart pick</div>
          <div className="text-sm text-white leading-relaxed">{pick.reasoning}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs font-semibold text-green-400 mb-1">News support</div>
            <div className="text-xs text-slate-300 leading-relaxed">{pick.newsSupport}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-400 mb-1">Main risk</div>
            <div className="text-xs text-slate-300 leading-relaxed">{pick.riskFactor}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [picks, setPicks] = useState([]);
  const [news, setNews] = useState([]);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  async function getDailyPicks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "daily_picks" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error + (data.raw ? " - " + data.raw.slice(0, 200) : ""));
      }
      setPicks(data.picks || []);
      setNews(data.news || []);
      setGenerated(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <div className="max-w-4xl mx-auto px-5 pb-20">
        <header className="py-8 border-b border-slate-800 mb-8 flex justify-between items-end flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono tracking-widest text-cyan-400 uppercase mb-1">AI-Powered Daily Picks</div>
            <h1 className="text-3xl font-bold tracking-tight">The Market <span className="text-cyan-400">Brief</span></h1>
          </div>
          <div className="text-right text-xs font-mono text-slate-400 leading-relaxed">
            Kalshi Edge Finder<br />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center mb-8">
          <h2 className="text-xl font-bold mb-2">Today&apos;s Top 3 Picks</h2>
          <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">Scans live Kalshi markets, finds mispriced odds with 60%+ estimated probability and meaningful payouts, backed by current news.</p>
          <button
            onClick={getDailyPicks}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-950 font-bold text-sm px-8 py-3.5 rounded-lg disabled:opacity-40 cursor-pointer"
          >
            {loading ? "Scanning markets..." : generated ? "Refresh Picks" : "Generate Today's Picks"}
          </button>
        </div>

        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center mb-6">
            <div className="w-10 h-10 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-sm font-mono text-slate-400">Scanning 40+ live markets, cross-referencing news, finding edges...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 mb-6 text-sm text-red-400 font-mono">{error}</div>
        )}

        {picks.length > 0 && (
          <div className="flex flex-col gap-6 mb-8">
            {picks.map((pick, i) => <PickCard key={i} pick={pick} index={i} />)}
          </div>
        )}

        {picks.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
            These are AI-generated research estimates, not financial advice. Probabilities are estimates and can be wrong. Track results over 30+ picks before trusting the edge claims. Never bet more than you can afford to lose.
          </div>
        )}

        {news.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
            <div className="px-4 py-3 border-b border-slate-800">
              <div className="text-xs font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />News informing today&apos;s picks
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {news.map((n, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="font-mono text-xs text-cyan-400 shrink-0 min-w-20 pt-0.5">{n.source?.slice(0, 14)}</span>
                  <span className="text-sm text-slate-300 leading-snug flex-1">{n.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
