document.addEventListener("DOMContentLoaded", async () => {
  const musicGrid = document.getElementById("musicGrid");
  const latestWrap = document.getElementById("latestRelease");

  const statTracks = document.getElementById("statTracks");
  const statRuntime = document.getElementById("statRuntime");
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
      if (statRuntime) statRuntime.textContent = "0m";
      if (statUpdated) statUpdated.textContent = "—";
      return;
    }

    allItems = items.map(item => ({
      ...item,
      title: decodeHtmlEntities(item.title || "")
    }));

    allItems.sort((a, b) => new Date(b.published) - new Date(a.published));

    const latest = allItems[0];
    const latestDate = latest?.published || "";

    const totalSeconds = allItems.reduce((sum, item) => {
      return sum + isoDurationToSeconds(item.duration || "PT0S");
    }, 0);

    if (statTracks) statTracks.textContent = String(allItems.length);
    if (statRuntime) statRuntime.textContent = formatRuntime(totalSeconds);
    if (statUpdated) statUpdated.textContent = formatDate(latestDate);

    if (latestWrap && latest) {
      latestWrap.innerHTML = `
        <a class="latest-card" href="${latest.url}" target="_blank" rel="noopener noreferrer">
          <div class="latest-thumb-wrap">
            <img class="latest-thumb" src="${latest.thumbnail}" alt="${escapeHtml(latest.title)}">
          </div>
          <div class="latest-content">
            <h3>${escapeHtml(latest.title)}</h3>
            <p class="release-date">${formatDate(latestDate)}</p>
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
    if (statRuntime) statRuntime.textContent = "—";
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

function isoDurationToSeconds(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

function formatRuntime(totalSeconds) {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}
