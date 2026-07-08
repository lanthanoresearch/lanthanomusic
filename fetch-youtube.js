const fs = require("fs");

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = "UC-LsR_7xdkNvIy4a3DtVzdA";

if (!API_KEY) {
  console.error("Missing YOUTUBE_API_KEY environment variable.");
  process.exit(1);
}

async function fetchJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API request failed: ${res.status} ${res.statusText}\n${text}`);
  }

  return res.json();
}

async function getUploadsPlaylistId() {
  const url =
    `https://www.googleapis.com/youtube/v3/channels` +
    `?key=${encodeURIComponent(API_KEY)}` +
    `&id=${encodeURIComponent(CHANNEL_ID)}` +
    `&part=contentDetails`;

  const data = await fetchJson(url);
  const item = data.items && data.items[0];

  const uploadsId = item?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsId) {
    throw new Error("Could not find uploads playlist for the channel.");
  }

  return uploadsId;
}

async function fetchAllUploads(uploadsPlaylistId) {
  let allItems = [];
  let nextPageToken = "";

  while (true) {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?key=${encodeURIComponent(API_KEY)}` +
      `&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
      `&part=snippet,contentDetails` +
      `&maxResults=50` +
      (nextPageToken ? `&pageToken=${encodeURIComponent(nextPageToken)}` : "");

    const data = await fetchJson(url);

    const pageItems = (data.items || []).map(item => {
      const snippet = item.snippet || {};
      const contentDetails = item.contentDetails || {};
      const videoId = contentDetails.videoId || snippet.resourceId?.videoId;

      if (!videoId) return null;

      const thumb =
        snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.standard?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        title: snippet.title || "",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        published: contentDetails.videoPublishedAt || snippet.publishedAt || "",
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
  const uploadsPlaylistId = await getUploadsPlaylistId();
  const items = await fetchAllUploads(uploadsPlaylistId);

  items.sort((a, b) => new Date(b.published) - new Date(a.published));

  const output = {
    artist: "Lanthano",
    channelId: CHANNEL_ID,
    uploadsPlaylistId,
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
