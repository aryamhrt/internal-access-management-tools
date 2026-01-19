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

  try {
    const apiKey = process.env.VITE_NOTION_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Notion API key not configured" });
    }

    let url, method;

    if (req.method === "POST") {
      // Create page
      url = "https://api.notion.com/v1/pages";
      method = "POST";
    } else if (req.method === "GET") {
      // Get page - need pageId from query
      const { pageId } = req.query;
      if (!pageId) {
        return res.status(400).json({ error: "Page ID is required" });
      }
      url = `https://api.notion.com/v1/pages/${pageId}`;
      method = "GET";
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Notion API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
