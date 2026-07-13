document.addEventListener("DOMContentLoaded", async () => {
  const musicGrid = document.getElementById("musicGrid");
  

  
  const featuredMusic = document.getElementById("featuredMusic");
const featuredDots = document.getElementById("featuredDots");

  const statTracks = document.getElementById("statTracks");
  const statRuntime = document.getElementById("statRuntime");
  const statUpdated = document.getElementById("statUpdated");

  if (!musicGrid) return;

  const PAGE_SIZE = 24;
  let shownCount = 0;
  let allItems = [];

  let featuredSongs = [];
let featuredIndex = 0;
let featuredTimer;

let touchStartX = 0;
let touchEndX = 0;
let swiping = false;

  
  try {
    const res = await fetch("music.json", { cache: "no-store" });
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    

    if (!items.length) {
      musicGrid.innerHTML = `<p class="empty-state">No music found yet.</p>`;
      
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



const newestAlbum = allItems[0].album;

featuredSongs = allItems.filter(song =>
    song.album === newestAlbum
);



    
    
console.log(featuredSongs.length);
console.table(featuredSongs);
    

    renderFeaturedMusic();
    if (featuredSongs.length > 1) {
    startFeaturedRotation();
    }
    const latest = allItems[0];
    const latestDate = latest?.published || "";

    const totalSeconds = allItems.reduce((sum, item) => {
      return sum + isoDurationToSeconds(item.duration || "PT0S");
    }, 0);

    if (statTracks) statTracks.textContent = String(allItems.length);
    if (statRuntime) statRuntime.textContent = formatRuntime(totalSeconds);
    if (statUpdated) statUpdated.textContent = formatDate(latestDate);

   
    renderNextBatch();

  } catch (err) {
    console.error("Error loading music.json:", err);
    musicGrid.innerHTML = `<p class="empty-state">Could not load music.</p>`;
    
    if (statTracks) statTracks.textContent = "—";
    if (statRuntime) statRuntime.textContent = "—";
    if (statUpdated) statUpdated.textContent = "—";
  }

  function renderFeaturedMusic() {



    if (!featuredMusic || !featuredSongs.length) return;



    const song = featuredSongs[featuredIndex];



    featuredMusic.innerHTML = `

        <a class="featured-card"

           href="${song.url}"

           target="_blank"

           rel="noopener noreferrer">



           <div class="featured-image-wrapper">



    <button

        class="featured-arrow featured-left"

        onclick="previousFeatured(event)">

    </button>



    <img

        class="featured-image"

        src="${song.thumbnail}"

        alt="${escapeHtml(song.title)}">



    <button

        class="featured-arrow featured-right"

        onclick="nextFeaturedManual(event)">

    </button>



</div>



            <div class="featured-content">



                <div class="featured-title">

                    ${escapeHtml(song.title)}

                </div>



                <div class="featured-description">

    <div style="font-size:1.1rem;">
        ${escapeHtml(song.album)}
    </div>

    <div style="color:#999;">
        Released ${formatDate(song.published)}
    </div>

</div>



                <div class="featured-read">

                    Listen on YouTube

                </div>



            </div>



        </a>

    `;
    renderDots();
const card = featuredMusic.querySelector(".featured-card");
    const link = featuredMusic.querySelector("a");

link.addEventListener("click", e => {
    if (swiping) {
        e.preventDefault();
    }
});
card.addEventListener("mouseenter", stopFeaturedRotation);
card.addEventListener("mouseleave", startFeaturedRotation);
card.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].clientX;
});

card.addEventListener("touchend", e => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
});
}
  
function previousFeatured(event){

    event.preventDefault();
    event.stopPropagation();

    stopFeaturedRotation();

    featuredIndex--;

    if(featuredIndex < 0){
        featuredIndex = featuredSongs.length - 1;
    }

    

  renderFeaturedMusic();
startFeaturedRotation();
    
}

  function renderDots() {

    if (!featuredDots) return;

    featuredDots.innerHTML = featuredSongs
        .map((_, i) =>
            `<span class="featured-dot${i === featuredIndex ? " active" : ""}"></span>`
        )
        .join("");
}

function nextFeatured() {

    featuredIndex++;

    if (featuredIndex >= featuredSongs.length) {
        featuredIndex = 0;
    }

    renderFeaturedMusic();
  

}

function startFeaturedRotation(){

    stopFeaturedRotation();

    featuredTimer = setInterval(nextFeatured,8000);

}

function stopFeaturedRotation() {
    clearInterval(featuredTimer);
}

function nextFeaturedManual(event){

    event.preventDefault();
    event.stopPropagation();

    stopFeaturedRotation();

    featuredIndex++;

    if(featuredIndex >= featuredSongs.length){
        featuredIndex = 0;
    }

    renderFeaturedMusic();
startFeaturedRotation();
    
}

window.previousFeatured = previousFeatured;
window.nextFeaturedManual = nextFeaturedManual;
  
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


function handleSwipe(){

    const distance = touchEndX - touchStartX;

    if(Math.abs(distance) < 40){
        return;
    }

    swiping = true;

    setTimeout(() => {
        swiping = false;
    }, 250);

    stopFeaturedRotation();

    if(distance > 0){

        featuredIndex--;

        if(featuredIndex < 0){
            featuredIndex = featuredSongs.length - 1;
        }

    }else{

        featuredIndex++;

        if(featuredIndex >= featuredSongs.length){
            featuredIndex = 0;
        }

    }

    
renderFeaturedMusic();
startFeaturedRotation();
    

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
