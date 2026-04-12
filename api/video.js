export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const HF_TOKEN = process.env.VITE_HF_TOKEN;
  if (!HF_TOKEN) return res.status(500).json({ error: "HF token not configured" });

  // Try multiple free models in order until one works
  const models = [
    "ali-vilab/text-to-video-ms-1.7b",
    "damo-vilab/text-to-video-ms-1.7b",
  ];

  for (const model of models) {
    try {
      let response = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
            "x-wait-for-model": "true"
          },
          body: JSON.stringify({ inputs: prompt })
        }
      );

      // If model loading, wait and retry once
      if (response.status === 503) {
        const errData = await response.json().catch(() => ({}));
        const waitTime = Math.min((errData.estimated_time || 20) * 1000, 30000);
        await new Promise(r => setTimeout(r, waitTime));
        response = await fetch(
          `https://router.huggingface.co/hf-inference/models/${model}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HF_TOKEN}`,
              "Content-Type": "application/json",
              "x-wait-for-model": "true"
            },
            body: JSON.stringify({ inputs: prompt })
          }
        );
      }

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Content-Length", buffer.byteLength);
        return res.status(200).send(Buffer.from(buffer));
      }

    } catch (err) {
      console.log(`Model ${model} failed:`, err.message);
      continue;
    }
  }

  // All models failed
  return res.status(500).json({
    error: "All video models are currently unavailable. Please try again in a few minutes."
  });
}
