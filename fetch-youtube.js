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


    const description = snippet.description || "";









      
let album = "";

const lines = description
  .split("\n")
  .map(line => line.trim())
  .filter(Boolean);

const artistLine = lines.findIndex(line => line.includes("·"));

if (artistLine !== -1 && artistLine + 1 < lines.length) {
  album = lines[artistLine + 1];
}





      
      
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
  album,
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

async function fetchDurations(videoIds) {
  const durationMap = {};

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);

    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?key=${encodeURIComponent(API_KEY)}` +
      `&id=${encodeURIComponent(chunk.join(","))}` +
      `&part=contentDetails`;

    const data = await fetchJson(url);

    for (const item of data.items || []) {
      durationMap[item.id] = item.contentDetails?.duration || "PT0S";
    }
  }

  return durationMap;
}

async function main() {
  const uploadsPlaylistId = await getUploadsPlaylistId();
  const items = await fetchAllUploads(uploadsPlaylistId);

  const videoIds = items.map(item => item.videoId);
  const durationMap = await fetchDurations(videoIds);

  const enrichedItems = items.map(item => ({
    ...item,
    duration: durationMap[item.videoId] || "PT0S"
  }));

  enrichedItems.sort((a, b) => new Date(b.published) - new Date(a.published));

  const output = {
    artist: "Lanthano",
    channelId: CHANNEL_ID,
    uploadsPlaylistId,
    updated: new Date().toISOString(),
    total: enrichedItems.length,
    items: enrichedItems
  };

  fs.writeFileSync("music.json", JSON.stringify(output, null, 2), "utf8");
  console.log(`Updated music.json with ${enrichedItems.length} items.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
