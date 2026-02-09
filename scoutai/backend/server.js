import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl / server-to-server
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGIN === "*" || origin === ALLOWED_ORIGIN) return cb(null, true);
    return cb(new Error("CORS blocked"), false);
  }
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false
}));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function systemPrompt(level){
  if (level === "School") {
    return "You are ScoutAI, a friendly research assistant. Explain concepts simply, define terms, and give clear examples. Provide a short summary first, then a structured explanation with headings and bullet points. Avoid jargon when possible.";
  }
  if (level === "Expert") {
    return "You are ScoutAI, an expert research assistant. Provide a concise summary, then a deeper structured analysis with nuance, assumptions, and limitations. Use technical terms when appropriate and keep the answer well-organized.";
  }
  // University default
  return "You are ScoutAI, a research assistant for students. Provide: (1) short summary, (2) structured detailed explanation with headings, (3) key points (bullets), (4) suggested outline for an essay/report when helpful. Be clear and academically neutral.";
}

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    const { message, level } = req.body || {};
    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return res.status(400).json({ error: "Invalid message" });
    }

    const lvl = ["School", "University", "Expert"].includes(level) ? level : "University";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt(lvl) },
        { role: "user", content: message.trim() }
      ]
    });

    const answer = completion.choices?.[0]?.message?.content || "";
    return res.json({ answer });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`ScoutAI backend running on :${PORT}`);
});