document.addEventListener("DOMContentLoaded", async () => {
  const musicGrid = document.getElementById("musicGrid");
  const latestWrap = document.getElementById("latestRelease");

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
      return;
    }

    // newest first
    items.sort((a, b) => new Date(b.published) - new Date(a.published));

    const latest = items[0];

    if (latestWrap) {
      latestWrap.innerHTML = `
        <a class="latest-card" href="${latest.url}" target="_blank" rel="noopener noreferrer">
          <div class="latest-thumb-wrap">
            <img class="latest-thumb" src="${latest.thumbnail}" alt="${escapeHtml(latest.title)}">
          </div>
          <div class="latest-content">
            <div class="section-eyebrow">Latest Release</div>
            <h3>${escapeHtml(latest.title)}</h3>
            <p class="release-date">${formatDate(latest.published)}</p>
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

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
