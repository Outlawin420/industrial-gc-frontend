// netlify/functions/run-prompt.js
// Netlify Functions (Node) - CommonJS style

exports.handler = async (event) => {
  // Basic CORS (helps if you later call this from other domains)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body || "{}");

    if (!prompt || typeof prompt !== "string") {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing prompt (string)." }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "OPENAI_API_KEY is not set in Netlify env vars." }),
      };
    }

    // Choose a model. gpt-4o is a common default in docs/examples. 1
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "OpenAI API error",
          details: data,
        }),
      };
    }

    // Responses API commonly returns output text in output_text. 2
    const report = data.output_text || "";

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Server error", details: String(err) }),
    };
  }
};
