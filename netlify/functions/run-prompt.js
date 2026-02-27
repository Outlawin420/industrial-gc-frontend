// netlify/functions/run-prompt.js

exports.handler = async (event) => {
  try {

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Use POST" }),
      };
    }

    const { prompt } = JSON.parse(event.body || "{}");

    const apiKey = process.env.OPENAI_API_KEY;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt || "Generate a revenue report",
        }),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: json?.error?.message || "OpenAI error",
        }),
      };
    }

    // ✅ SAFE TEXT EXTRACTION
    let report = json.output_text || "";

    if (!report && Array.isArray(json.output)) {
      for (const item of json.output) {
        if (item.content) {
          for (const c of item.content) {
            if (c.text) report += c.text;
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message || "Server error",
      }),
    };
  }
};
