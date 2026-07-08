const fs = require("fs");

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = "UC-LsR_7xdkNvIy4a3DtVzdA";

if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY environment variable.");
  process.exit(1);
}

async function main() {
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search` +
    `?key=${encodeURIComponent(API_KEY)}` +
    `&channelId=${encodeURIComponent(CHANNEL_ID)}` +
    `&part=snippet,id` +
    `&order=date` +
    `&type=video` +
    `&maxResults=24`;

  const res = await fetch(searchUrl);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API request failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = await res.json();

  const items = (data.items || []).map(item => {
    const videoId = item.id.videoId;
    const snippet = item.snippet || {};

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
  }).filter(item => item.videoId && item.title);

  const output = {
    artist: "Lanthano",
    channelId: CHANNEL_ID,
    updated: new Date().toISOString(),
    items
  };

  fs.writeFileSync("music.json", JSON.stringify(output, null, 2), "utf8");
  console.log(`Updated music.json with ${items.length} items.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
