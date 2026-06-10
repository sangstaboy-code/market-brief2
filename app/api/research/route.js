import { NextResponse } from "next/server";

const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
const NEWS_KEY = process.env.NEWS_API_KEY;
const KALSHI_KEY = process.env.KALSHI_API_KEY;

async function getKalshiMarkets() {
  try {
    const res = await fetch(
      "https://trading-api.kalshi.com/trade-api/v2/markets?limit=100&status=open",
      {
        headers: {
          Authorization: "Bearer " + KALSHI_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.markets || [])
      .filter(function(m) { return (m.volume || 0) > 100; })
      .slice(0, 40)
      .map(function(m) {
        return {
          id: m.ticker,
          title: m.title,
          yesPrice: Math.round((m.yes_ask || 0.5) * 100),
          noPrice: 100 - Math.round((m.yes_bid || 0.5) * 100),
          volume: m.volume || 0,
          closeDate: m.close_time || "",
        };
      });
  } catch (e) {
    return [];
  }
}

async function getNews(query) {
  try {
    var q = encodeURIComponent(query);
    const res = await fetch(
      "https://newsapi.org/v2/everything?q=" + q + "&pageSize=10&sortBy=publishedAt&language=en&apiKey=" + NEWS_KEY
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).slice(0, 8).map(function(a) {
      return {
        title: a.title,
        source: (a.source && a.source.name) ? a.source.name : "News",
        publishedAt: a.publishedAt,
      };
    });
  } catch (e) {
    return [];
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const mode = body.mode;
if (!CLAUDE_KEY) { return NextResponse.json({ picks: [], error: "NO KEY: " + typeof CLAUDE_KEY, news: [] }); }
    if (mode === "daily_picks") {
      const markets = await getKalshiMarkets();
      const news = await getNews("politics economy federal reserve election supreme court");

      var marketList = "";
      for (var i = 0; i < markets.length; i++) {
        marketList += markets[i].title + " | YES price: " + markets[i].yesPrice + "% | Volume: " + markets[i].volume + "\n";
      }

      var newsList = "";
      for (var n = 0; n < news.length; n++) {
        newsList += "[" + news[n].source + "] " + news[n].title + "\n";
      }

      var prompt = "Here are live Kalshi prediction markets with current YES prices:\n\n" + marketList +
        "\n\nRecent news headlines:\n" + newsList +
        "\n\nSelect the 3 BEST picks. A good pick has: estimated true probability above 60%, but a market price LOW enough that the payout is meaningful (look for mispriced markets where your estimate differs from the market price). For each pick respond in this exact JSON format, with no other text before or after:\n" +
        '{"picks":[{"market":"market title","side":"YES or NO","marketPrice":45,"ourProbability":68,"payout":"$100 returns $222","edge":23,"confidence":7,"reasoning":"2-3 sentences why this is mispriced","newsSupport":"which news headline supports this","riskFactor":"the main thing that could make this lose"}]}';

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: "You are a prediction market analyst who finds mispriced Kalshi markets. You only recommend picks where your estimated probability is at least 60% AND meaningfully higher than the market price, creating positive expected value. Respond ONLY with valid JSON, no markdown, no backticks, no other text.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const claudeData = await claudeRes.json();
      var raw = "";
      if (claudeData.content && claudeData.content.length > 0) {
        raw = claudeData.content.map(function(b) { return b.text || ""; }).join("");
      }

      raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    var firstBrace = raw.indexOf("{");
    var lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) { raw = raw.slice(firstBrace, lastBrace + 1); }

    var picks = [];
    try {
      var parsed = JSON.parse(raw);
      picks = parsed.picks || [];
    } catch (e) {
      return NextResponse.json({ picks: [], error: "RAW: " + raw.slice(0, 500), news: news });
    }

      return NextResponse.json({ picks: picks, news: news, marketCount: markets.length });
    }

    return NextResponse.json({ picks: [], news: [] });

  } catch (err) {
    return NextResponse.json({ picks: [], error: err.message, news: [] });
  }
}
