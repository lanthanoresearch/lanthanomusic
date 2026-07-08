const fs = require("fs");

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = "UC-LsR_7xdkNvIy4a3DtVzdA";

if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY environment variable.");
  process.exit(1);
}

async function fetchAllVideos() {
  let allItems = [];
  let nextPageToken = "";

  while (true) {
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?key=${encodeURIComponent(API_KEY)}` +
      `&channelId=${encodeURIComponent(CHANNEL_ID)}` +
      `&part=snippet,id` +
      `&order=date` +
      `&type=video` +
      `&maxResults=50` +
      (nextPageToken ? `&pageToken=${encodeURIComponent(nextPageToken)}` : "");

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`YouTube API request failed: ${res.status} ${res.statusText}\n${text}`);
    }

    const data = await res.json();

    const pageItems = (data.items || []).map(item => {
      const videoId = item.id?.videoId;
      const snippet = item.snippet || {};

      if (!videoId) return null;

      const thumb =
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        title: snippet.title || "",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        published: snippet.publishedAt || "",
        thumbnail: thumb
      };
    }).filter(Boolean);

    allItems.push(...pageItems);

    if (!data.nextPageToken) break;
    nextPageToken = data.nextPageToken;
  }

  return allItems;
}

async function main() {
  const items = await fetchAllVideos();

  items.sort((a, b) => new Date(b.published) - new Date(a.published));

  const output = {
    artist: "Lanthano",
    channelId: CHANNEL_ID,
    updated: new Date().toISOString(),
    total: items.length,
    items
  };

  fs.writeFileSync("music.json", JSON.stringify(output, null, 2), "utf8");
  console.log(`Updated music.json with ${items.length} items.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
