const fs = require("fs");

const CHANNEL_ID = "UC-LsR_7xdkNvIy4a3DtVzdA";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

async function main() {
  const res = await fetch(FEED_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch YouTube feed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]);

  const items = entries.map(entry => {
    const title = getTag(entry, "title");
    const videoId = getTag(entry, "yt:videoId");
    const published = getTag(entry, "published");

    return {
      title: decodeXml(title || ""),
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      published,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
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

function getTag(block, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escaped}>([\\s\\S]*?)<\\/${escaped}>`));
  return match ? match[1].trim() : "";
}

function decodeXml(str) {
  return str
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
