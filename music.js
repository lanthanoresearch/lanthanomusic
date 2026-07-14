import Fuse from "./fuse.basic.min.mjs";



let player;
let currentVideoId = null;
let allItems = [];

let isPaused = false;


let currentSong = null;
let timerInterval = null;

const playerBar = document.getElementById("musicPlayerBar");
const playerArtwork = document.getElementById("playerArtwork");
const playerTitle = document.getElementById("playerTitle");
const playerAlbum = document.getElementById("playerAlbum");
const playerTime = document.getElementById("playerTime");
const closePlayer = document.getElementById("closePlayer");

const playerPlayPause =
document.getElementById("playerPlayPause");

closePlayer.addEventListener("click", closePlayerBar);
playerPlayPause.addEventListener("click", () => {

    if(!player){
        return;
    }

    const state = player.getPlayerState();

    if(state === YT.PlayerState.PLAYING){

        player.pauseVideo();

    }else if(
        state === YT.PlayerState.PAUSED ||
        state === YT.PlayerState.CUED
    ){

        player.playVideo();

    }

});

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
 



  const searchBox = document.getElementById("searchBox");
const searchResults = document.getElementById("searchResults");

let fuse;


  
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

  allItems.sort((a, b) => {

    const dayA = a.published.substring(0,10);
    const dayB = b.published.substring(0,10);

    if(dayA !== dayB){
        return dayB.localeCompare(dayA);
    }

    const albumCompare = a.album.localeCompare(b.album);

    if(albumCompare !== 0){
        return albumCompare;
    }

    return a.title.localeCompare(b.title);

});


fuse = new Fuse(allItems, {
    includeMatches: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
        {
            name: "title",
            weight: 10
        },
        {
            name: "album",
            weight: 4
        }
    ]
});

searchBox.disabled = false;
searchBox.placeholder = "Search all music...";


    

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

${featuredSongs.length > 1 ? `
<button
    class="featured-arrow featured-left"
    onclick="previousFeatured(event)">
</button>
` : ""}

<img
    class="featured-image"
    src="${song.thumbnail}"
    alt="${escapeHtml(song.title)}">

${featuredSongs.length > 1 ? `
<button
    class="featured-arrow featured-right"
    onclick="nextFeaturedManual(event)">
</button>
` : ""}


</div>



            <div class="featured-content">



                <div class="featured-title">

                    ${escapeHtml(song.title)}

                </div>



                <div class="featured-description">

   <div class="featured-album">
    ${escapeHtml(song.album)}
</div>

    <div style="color:#999;">
        Released ${formatDate(song.published)}
    </div>

</div>



                <div class="featured-read">

    <button
    class="play-button featured-play"
    data-video="${song.videoId}"
        onclick="event.preventDefault(); playSong('${song.url}');">
      

        ▶ Play

    </button>

  

</div>



            </div>



        </a>

    `;
    renderDots();
      updatePlayButtons();
const card = featuredMusic.querySelector(".featured-card");
    const link = featuredMusic.querySelector(".featured-card");

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

    if (featuredSongs.length <= 1) {
        featuredDots.innerHTML = "";
        return;
    }

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






function handleSwipe() {

    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) < 40) {
        return;
    }

    swiping = true;

    setTimeout(() => {
        swiping = false;
    }, 250);

    stopFeaturedRotation();

    if (distance > 0) {

        featuredIndex--;

        if (featuredIndex < 0) {
            featuredIndex = featuredSongs.length - 1;
        }

    } else {

        featuredIndex++;

        if (featuredIndex >= featuredSongs.length) {
            featuredIndex = 0;
        }

    }

    renderFeaturedMusic();

    if (featuredSongs.length > 1) {
        startFeaturedRotation();
    }

    touchStartX = 0;
    touchEndX = 0;
}



  

  
  function renderNextBatch() {
    const nextItems = allItems.slice(shownCount, shownCount + PAGE_SIZE);

    const html = nextItems.map(item => `
      <a class="music-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
        <img class="music-thumb" src="${item.thumbnail}" alt="${escapeHtml(item.title)}">
       


<div class="music-meta">

    <h3>${escapeHtml(item.title)}</h3>

    <p class="music-album">
        ${escapeHtml(item.album)}
    </p>

    <p class="music-date">
        ${formatDate(item.published)}
    </p>

   <button
    class="play-button"
    data-video="${item.videoId}"
        onclick="
            event.preventDefault();
            event.stopPropagation();
            playSong('${item.url}');
        ">

        ▶ Play

    </button>

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


  
searchBox.addEventListener("input", () => {

    const query = searchBox.value.trim();

    if (query.length < 2) {

        searchResults.style.display = "none";
        return;

    }

    const results = fuse.search(query).slice(0, 10);

    if (!results.length) {

        searchResults.innerHTML =
            `<div class="search-empty">
                No songs found.
            </div>`;

        searchResults.style.display = "block";
        return;
    }

    searchResults.innerHTML = results.map(result => {

        const song = result.item;

        return `
            <a
                class="search-result"
                href="${song.url}"
                target="_blank"
                rel="noopener noreferrer">

                <img
                    class="search-thumb"
                    src="${song.thumbnail}"
                    alt="${escapeHtml(song.title)}">

               <div style="
    flex:1;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
">

    <div style="min-width:0;">

        <div class="search-title">
            ${escapeHtml(song.title)}
        </div>

        <div class="search-source">
            ${escapeHtml(song.album)}
            •
            ${formatDate(song.published)}
        </div>

    </div>

  <button
    class="search-play-button"
    data-video="${song.videoId}"
        onclick="
            event.preventDefault();
            event.stopPropagation();
            playSong('${song.url}');
        ">

        ▶

    </button>

</div>

            </a>
        `;

    }).join("");

    searchResults.style.display = "block";
updatePlayButtons();
});


  document.addEventListener("click", e => {

    if (!document.querySelector(".search-wrapper").contains(e.target)) {

        searchResults.style.display = "none";

    }

});
  
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



window.onYouTubeIframeAPIReady = function () {

player = new YT.Player("youtubePlayer", {

    videoId: "",

    playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0
    },

    events: {

        onReady() {
            console.log("Player Ready");
        },

        onStateChange(event) {

            console.log("State:", event.data);

            if(event.data === YT.PlayerState.PLAYING){

                isPaused = false;
                updatePlayButtons();

                clearInterval(timerInterval);

                timerInterval = setInterval(() => {

                    const current = player.getCurrentTime();
                    const duration = player.getDuration();

                    console.log(current, duration);

                    playerTime.textContent =
                        formatClock(current) +
                        " / " +
                        formatClock(duration);

                }, 250);

            }

            if(event.data === YT.PlayerState.PAUSED){

                isPaused = true;
                updatePlayButtons();

            }

            if(event.data === YT.PlayerState.ENDED){

                closePlayerBar();

            }

        }

    }

});

};

window.playSong = function(url){

    const videoId = new URL(url).searchParams.get("v");

    if(!videoId){
        return;
    }

    currentVideoId = videoId;
isPaused = false;

    currentSong = allItems.find(song => song.videoId === videoId);

updatePlayButtons();

  
    if(currentSong){

        playerArtwork.src = currentSong.thumbnail;
        playerTitle.textContent = currentSong.title;
        playerAlbum.textContent = currentSong.album;

        playerBar.hidden = false;

    }

    if(player){
        player.loadVideoById(videoId);
      
    }

};

function formatClock(seconds){

    seconds = Math.floor(seconds);

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${String(secs).padStart(2,"0")}`;

}


function closePlayerBar(){

    if(player){
        player.stopVideo();
    }

    playerBar.hidden = true;

    currentVideoId = null;
    currentSong = null;

    clearInterval(timerInterval);
    playerTime.textContent = "0:00 / 0:00";
  isPaused = false;
updatePlayButtons();

}



function updatePlayButtons(){

    document
        .querySelectorAll(".play-button")
        .forEach(button => {

            if(button.dataset.video === currentVideoId){

                if(isPaused){

                    button.innerHTML = "▶ Play";

                }else{

                    button.innerHTML = "❚❚ Pause";

                }

            }else{

                button.innerHTML = "▶ Play";

            }

        });

    document
        .querySelectorAll(".search-play-button")
        .forEach(button => {

            if(button.dataset.video === currentVideoId){

                if(isPaused){

                    button.innerHTML = "▶";

                }else{

                    button.innerHTML = "❚❚";

                }

            }else{

                button.innerHTML = "▶";

            }

        });

    playerPlayPause.textContent =
        isPaused ? "▶" : "❚❚";
}
