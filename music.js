document.addEventListener("DOMContentLoaded", async () => {
  const musicGrid = document.getElementById("musicGrid");
  const latestWrap = document.getElementById("latestRelease");

  const statTracks = document.getElementById("statTracks");
  const statVideos = document.getElementById("statVideos");
  const statUpdated = document.getElementById("statUpdated");

  if (!musicGrid) return;

  const PAGE_SIZE = 24;
  let shownCount = 0;
  let allItems = [];

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

    allItems = items.map(item => ({
      ...item,
      title: decodeHtmlEntities(item.title || "")
    }));

    allItems.sort((a, b) => new Date(b.published) - new Date(a.published));

    if (statTracks) statTracks.textContent = String(allItems.length);
    if (statVideos) statVideos.textContent = String(allItems.length);
    if (statUpdated) statUpdated.textContent = formatShortDate(data.updated);

    const latest = allItems[0];

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

    renderNextBatch();

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

  function renderNextBatch() {
    const nextItems = allItems.slice(shownCount, shownCount + PAGE_SIZE);

    const html = nextItems.map(item => `
      <a class="music-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
        <img class="music-thumb" src="${item.thumbnail}" alt="${escapeHtml(item.title)}">
        <div class="music-meta">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${formatDate(item.published)}</p>
        </div>
      </a>
    `).join("");

    musicGrid.insertAdjacentHTML("beforeend", html);
    shownCount += nextItems.length;

    updateShowMoreButton();
  }

  function updateShowMoreButton() {
    let existing = document.getElementById("showMoreButton");
    if (existing) existing.remove();

    if (shownCount >= allItems.length) return;

    const button = document.createElement("button");
    button.id = "showMoreButton";
    button.className = "platform-link";
    button.type = "button";
    button.textContent = "Show More";
    button.style.display = "block";
    button.style.margin = "30px auto 0 auto";

    button.addEventListener("click", renderNextBatch);
    musicGrid.insertAdjacentElement("afterend", button);
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
