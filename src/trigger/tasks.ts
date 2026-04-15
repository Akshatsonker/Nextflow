import { task } from "@trigger.dev/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── LLM Task (Gemini) ────────────────────────────────────────────────────────

export const llmTask = task({
  id: "llm-node",
  maxDuration: 120,

  run: async (payload: {
    model: string;
    systemPrompt?: string;
    userMessage: string;
    imageUrls?: string[];
  }) => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: payload.model });

    const parts: any[] = [];

    // System prompt
    if (payload.systemPrompt) {
      parts.push({ text: `System: ${payload.systemPrompt}\n\n` });
    }

    // Images (optional)
    if (payload.imageUrls?.length) {
      for (const url of payload.imageUrls) {
        try {
          const res = await fetch(url);
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType = res.headers.get("content-type") || "image/jpeg";

          parts.push({
            inlineData: {
              data: base64,
              mimeType,
            },
          });
        } catch (e) {
          console.error("Failed to load image:", url, e);
        }
      }
    }

    // User message (required)
    parts.push({ text: payload.userMessage });

    const result = await model.generateContent(parts);

    return {
      output: result.response.text() || "No response",
    };
  },
});

// ─── Crop Image Task (Transloadit) ────────────────────────────────────────────

export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 60,

  run: async (payload: {
    imageUrl: string;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    transloaditKey: string;
    transloaditSecret: string;
  }) => {
    const assembly = {
      steps: {
        import: {
          robot: "/http/import",
          url: payload.imageUrl,
        },
        crop: {
          robot: "/ffmpeg/encode",
          use: "import",
          ffmpeg_stack: "v6.0.0",
          result: true,
          ffmpeg: {
            vf: `crop=iw*${payload.widthPercent / 100}:ih*${payload.heightPercent / 100}:iw*${payload.xPercent / 100}:ih*${payload.yPercent / 100}`,
            vframes: 1,
          },
          output_meta: { has_video: false },
        },
        export: {
          robot: "/image/optimize",
          use: "crop",
          result: true,
        },
      },
    };

    const response = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth: { key: payload.transloaditKey },
        steps: assembly.steps,
      }),
    });

    const data = await response.json();
    const assemblyUrl = data.assembly_url;

    let attempts = 0;
    while (attempts < 30) {
      await new Promise((r) => setTimeout(r, 2000));

      const poll = await fetch(assemblyUrl).then((r) => r.json());

      if (poll.ok === "ASSEMBLY_COMPLETED") {
        const result = poll.results?.crop?.[0] || poll.results?.export?.[0];

        return {
          output: result?.ssl_url || result?.url || "",
        };
      }

      if (poll.error) throw new Error(poll.error);

      attempts++;
    }

    throw new Error("Crop assembly timed out");
  },
});

// ─── Extract Frame Task ───────────────────────────────────────────────────────

export const extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 120,

  run: async (payload: {
    videoUrl: string;
    timestamp: string;
    transloaditKey: string;
    transloaditSecret: string;
  }) => {
    let seekTime = "0";

    if (payload.timestamp.endsWith("%")) {
      const pct = parseFloat(payload.timestamp) / 100;
      seekTime = `${pct * 100}%`;
    } else {
      seekTime = payload.timestamp || "0";
    }

    const steps: Record<string, any> = {
      import: {
        robot: "/http/import",
        url: payload.videoUrl,
      },
      frame: {
        robot: "/video/encode",
        use: "import",
        ffmpeg_stack: "v6.0.0",
        result: true,
        ffmpeg: {
          ss: payload.timestamp.endsWith("%") ? undefined : seekTime,
          vframes: 1,
          f: "image2",
        },
        width: 1280,
        height: 720,
        resize_strategy: "fit",
        result_meta: { has_video: false, has_audio: false },
      },
    };

    const response = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth: { key: payload.transloaditKey },
        steps,
      }),
    });

    const data = await response.json();
    const assemblyUrl = data.assembly_url;

    let attempts = 0;

    while (attempts < 40) {
      await new Promise((r) => setTimeout(r, 3000));

      const poll = await fetch(assemblyUrl).then((r) => r.json());

      if (poll.ok === "ASSEMBLY_COMPLETED") {
        const result = poll.results?.frame?.[0];

        return {
          output: result?.ssl_url || result?.url || "",
        };
      }

      if (poll.error) throw new Error(poll.error);

      attempts++;
    }

    throw new Error("Frame extraction timed out");
  },
});