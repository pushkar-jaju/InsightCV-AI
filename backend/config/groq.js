const axios = require("axios");

// ─────────────────────────────────────────
// Groq Inference API config
// Model : mixtral-8x7b-32768
// Free tier: 14,400 req/day, no card needed
// Docs  : https://console.groq.com/docs/openai
// ─────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─────────────────────────────────────────
// generateAIContent(prompt)
// Sends a user message to Groq and returns
// the model reply as a plain string.
// ─────────────────────────────────────────
const generateAIContent = async (prompt) => {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,              // enough for full ATS/job-match JSON
      temperature: 0.1,
      response_format: { type: "json_object" }, // forces valid JSON output
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000, // increased to match larger token budget
    }
  );

  // OpenAI-compatible shape: choices[0].message.content
  const content = response.data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Unexpected response format from Groq API");
  }

  return content.trim();
};

module.exports = { generateAIContent };
