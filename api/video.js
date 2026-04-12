export default async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const HF_TOKEN = process.env.VITE_HF_TOKEN;
  if (!HF_TOKEN) return res.status(500).json({ error: "HF token not configured" });

  try {
    let response = await fetch(
      "https://router.huggingface.co/hf-inference/models/Wan-AI/Wan2.1-T2V-14B",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_frames: 16,
            num_inference_steps: 20,
            width: 512,
            height: 288
          }
        })
      }
    );

    // If model is loading, wait and retry
    if (response.status === 503) {
      const errData = await response.json().catch(() => ({}));
      const waitTime = (errData.estimated_time || 30) * 1000;
      await new Promise(r => setTimeout(r, Math.min(waitTime, 60000)));

      response = await fetch(
        "https://router.huggingface.co/hf-inference/models/Wan-AI/Wan2.1-T2V-14B",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
            "x-wait-for-model": "true"
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              num_frames: 16,
              num_inference_steps: 20,
              width: 512,
              height: 288
            }
          })
        }
      );
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error || `HuggingFace error: ${response.status}`
      });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", buffer.byteLength);
    res.status(200).send(Buffer.from(buffer));

  } catch (err) {
    console.error("Video generation error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
