document.addEventListener("DOMContentLoaded", async () => {
  const musicGrid = document.getElementById("musicGrid");
  const latestWrap = document.getElementById("latestRelease");

  const statTracks = document.getElementById("statTracks");
  const statVideos = document.getElementById("statVideos");
  const statUpdated = document.getElementById("statUpdated");

  if (!musicGrid) return;

  try {
    const res = await fetch("music.json", { cache: "no-store" });
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      musicGrid.innerHTML = `<p class="empty-state">No music found yet.</p>`;
      if (latestWrap) {
        latestWrap.innerHTML = `<p class="empty-state">No latest release available yet.</p>`;
      }
      if (statTracks) statTracks.textContent = "0";
      if (statVideos) statVideos.textContent = "0";
      if (statUpdated) statUpdated.textContent = "—";
      return;
    }

    // Decode titles coming from YouTube / JSON before sorting/rendering
    const cleanedItems = items.map(item => ({
      ...item,
      title: decodeHtmlEntities(item.title || "")
    }));

    cleanedItems.sort((a, b) => new Date(b.published) - new Date(a.published));

    if (statTracks) statTracks.textContent = String(cleanedItems.length);
    if (statVideos) statVideos.textContent = String(cleanedItems.length);
    if (statUpdated) statUpdated.textContent = formatShortDate(data.updated);

    const latest = cleanedItems[0];

    if (latestWrap) {
      latestWrap.innerHTML = `
        <a class="latest-card" href="${latest.url}" target="_blank" rel="noopener noreferrer">
          <div class="latest-thumb-wrap">
            <img class="latest-thumb" src="${latest.thumbnail}" alt="${escapeHtml(latest.title)}">
          </div>
          <div class="latest-content">
            <h3>${escapeHtml(latest.title)}</h3>
            <p class="release-date">${formatDate(latest.published)}</p>
            <p class="release-desc">
              Latest Lanthano upload pulled automatically from YouTube.
            </p>
            <span class="watch-button">Listen on YouTube</span>
          </div>
        </a>
      `;
    }

    musicGrid.innerHTML = cleanedItems.map(item => `
      <a class="music-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
        <img class="music-thumb" src="${item.thumbnail}" alt="${escapeHtml(item.title)}">
        <div class="music-meta">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${formatDate(item.published)}</p>
        </div>
      </a>
    `).join("");

  } catch (err) {
    console.error("Error loading music.json:", err);
    musicGrid.innerHTML = `<p class="empty-state">Could not load music.</p>`;
    if (latestWrap) {
      latestWrap.innerHTML = `<p class="empty-state">Could not load latest release.</p>`;
    }
    if (statTracks) statTracks.textContent = "—";
    if (statVideos) statVideos.textContent = "—";
    if (statUpdated) statUpdated.textContent = "—";
  }
});

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatShortDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function decodeHtmlEntities(str) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  return textarea.value;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
