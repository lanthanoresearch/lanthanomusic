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

    items.sort((a, b) => new Date(b.published) - new Date(a.published));

    if (statTracks) statTracks.textContent = String(items.length);
    if (statVideos) statVideos.textContent = String(items.length);
    if (statUpdated) statUpdated.textContent = formatShortDate(data.updated);

    const latest = items[0];

    if (latestWrap) {
      latestWrap.innerHTML = `
        <a class="latest-card" href="${latest.url}" target="_blank" rel="noopener noreferrer">
          <div class="latest-thumb-wrap">
            <img class="latest-thumb" src="${latest.thumbnail}" alt="${escapeHtml(latest.title)}">
          </div>
          <div class="latest-content">
            <div class="section-eyebrow" style="text-align:left; margin-bottom:8px;">Latest Release</div>
            <h3>${escapeHtml(latest.title)}</h3>
            <p class="release-date">${formatDate(latest.published)}</p>
            <p class="release-desc">
              Latest Lanthano upload pulled automatically from YouTube.
            </p>
            <span class="watch-button">Watch on YouTube</span>
          </div>
        </a>
      `;
    }

    musicGrid.innerHTML = items.map(item => `
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

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
