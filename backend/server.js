import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGIN === "*" || origin === ALLOWED_ORIGIN) return cb(null, true);
    return cb(new Error("CORS blocked: " + origin), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/", (req, res) => {
  res.status(200).send("ScoutAI backend (Gemini) is running ✅ Use GET /health and POST /api/chat");
});

app.get("/health", (req, res) => res.json({ ok: true }));

function systemPrompt(level){
  if (level === "School") {
    return "You are ScoutAI. Explain simply, define terms, use examples. Output: short summary, then structured explanation, then key points.";
  }
  if (level === "Expert") {
    return "You are ScoutAI. Provide a concise summary, then deeper structured analysis with nuance, assumptions, limitations, and key points.";
  }
  return "You are ScoutAI for students. Output: (1) short summary, (2) structured detailed explanation with headings, (3) key points, (4) optional essay/report outline when helpful.";
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, level } = req.body || {};
    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return res.status(400).json({ error: "Invalid message" });
    }

    const lvl = ["School", "University", "Expert"].includes(level) ? level : "University";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${systemPrompt(lvl)}\n\nUser question:\n${message.trim()}`;

    const result = await model.generateContent(prompt);
    const answer = result?.response?.text?.() || "";

    return res.json({ answer });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({
      error: "Gemini request failed",
      detail: String(err?.message || err),
    });
  }
});

app.listen(PORT, () => console.log("ScoutAI backend (Gemini) running on", PORT));

app.get("/models", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});