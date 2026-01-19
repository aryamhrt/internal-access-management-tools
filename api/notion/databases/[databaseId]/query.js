export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.VITE_NOTION_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Notion API key not configured" });
    }

    const { databaseId, ...body } = req.body;

    if (!databaseId) {
      return res.status(400).json({ error: "Database ID is required" });
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Notion API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
