export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { prompt } = await req.json();

    // MOCK MODE: works without any key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const mock = [
        "Signal Detected:",
        "• Industrial permit activity indicating facility upgrades in selected area",
        "",
        "Evidence:",
        "• Not Found (mock mode)",
        "",
        "Opportunity Window:",
        "• 3–6 months pre-bid (estimated)",
        "",
        "Ideal Buyer (job titles):",
        "• Facilities Director",
        "• Capital Projects Manager",
        "• EPC Project Manager",
        "• Maintenance Manager",
        "",
        "Monetization Strategy:",
        "• Offer pre-construction walkthrough + ROM + scope packaging",
        "",
        "First 30-Day Action Plan:",
        "• Week 1: Identify top 10 target facilities + engineering firms",
        "• Week 2: Outreach with 2-sentence positioning + request intro call",
        "• Week 3: Build scope map (electrical, controls, civil, mechanical)",
        "• Week 4: Secure site visit + propose early services agreement",
      ].join("\n");

      return new Response(JSON.stringify({ report: mock }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // REAL MODE (requires OPENAI_API_KEY set in Netlify)
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: [
          {
            role: "system",
            content:
              "Return ONLY a clean, readable report in plain text with headings and bullet points. No JSON.",
          },
          { role: "user", content: prompt || "Generate a report." },
        ],
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream error HTTP ${r.status}`, details: raw }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(raw);
    const text = data.output_text || "";

    return new Response(JSON.stringify({ report: text || "No output returned." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Function crashed", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
