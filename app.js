// --------------------
// GLOBAL STATE
// --------------------
let piReady = false;
let currentUser = null;

const authBtn = document.getElementById("authBtn");
const feed = document.getElementById("feed");

// --------------------
// PI SDK ACCESS
// --------------------
function getPi() {
  return window.Pi;
}

// --------------------
// INIT PI (FIXED)
// --------------------
function initPi() {
  const Pi = getPi();

  if (!Pi) {
    console.error("Pi SDK not loaded");
    return;
  }

  try {
    console.log("Initializing Pi SDK...");

    Pi.init({
      version: "2.0",
      sandbox: true
    });

    piReady = true;

    console.log("Pi SDK initialized successfully");

    if (authBtn) authBtn.disabled = false;

  } catch (err) {
    console.error("Pi init error:", err);
  }
}

// --------------------
// SPLASH
// --------------------
setTimeout(() => {
  const splash = document.getElementById("splash");
  if (splash) splash.style.display = "none";
}, 2500);

// --------------------
// LOGIN (FIXED)
// --------------------
async function login() {
  console.log("LOGIN CLICKED");
  console.log("Pi object:", window.Pi);
  console.log("piReady:", piReady);

  const Pi = getPi();

  if (!piReady || !Pi) {
    alert("Pi SDK not ready. Refresh and try again.");
    return;
  }

  try {
    const auth = await Pi.authenticate(
      ['username', 'payments'],
      { sandbox: true } // ✅ CRITICAL FIX
    );

    currentUser = auth.user;

    alert("Welcome @" + auth.user.username);

    authBtn.textContent = "Sign Out";
    authBtn.onclick = signOut;

  } catch (err) {
    console.error("AUTH ERROR:", err);
    alert("Login failed: " + err.message);
  }
}

// --------------------
// SIGN OUT
// --------------------
function signOut() {
  currentUser = null;
  authBtn.textContent = "Login";
  authBtn.onclick = login;
  alert("Signed out");
}

// --------------------
// TIP
// --------------------
function tip() {
  const Pi = getPi();

  if (!Pi) return;

  Pi.createPayment({
    amount: 0.05,
    memo: "Support @prince_AI",
    metadata: { type: "tip" }
  }, {
    onReadyForServerApproval: () => {},
    onReadyForServerCompletion: () => {},
    onCancel: () => {},
    onError: (err) => console.error(err)
  });
}

// --------------------
// VIDEO DATA
// --------------------
const videos = [
  {
    id: "1",
    title: "I share AI tools to help you work smarter and make money online 🔥",
    creator: "prince_AI",
    url: "https://www.youtube.com/embed/sRcd9fK6ECw?enablejsapi=1&mute=1"
  },
  {
    id: "2",
    title: "AI me real business 🔥",
    creator: "prince_AI",
    url: "https://www.youtube.com/embed/tfkidUX4viA?enablejsapi=1&mute=1"
  },
  {
    id: "3",
    title: "Would you hire a developer or let AI do it? 🔥",
    creator: "prince_AI",
    url: "https://www.youtube.com/embed/HEYjc91mzAs?enablejsapi=1&mute=1"
  }
];

let index = 0;

// --------------------
// RENDER
// --------------------
function render(video) {
  const div = document.createElement("div");
  div.className = "video-container";

  div.innerHTML = `
    <iframe src="${video.url}" allow="autoplay"></iframe>

    <div class="overlay">
      <h1>🔥 ${video.title}</h1>
      <p>@${video.creator}</p>
    </div>

    <div class="actions">
      <button onclick="tip()">💰 Tip</button>
    </div>
  `;

  feed.appendChild(div);
  observe(div);
}

// --------------------
// LOAD MORE
// --------------------
function loadMore() {
  render(videos[index % videos.length]);
  index++;
}

// --------------------
// INIT FEED
// --------------------
function initFeed() {
  for (let i = 0; i < 3; i++) {
    loadMore();
  }
}

// --------------------
// SCROLL LOAD
// --------------------
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadMore();
  }
});

// --------------------
// AUTO PLAY
// --------------------
function observe(el) {
  const iframe = el.querySelector("iframe");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!iframe) return;

      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: e.isIntersecting ? "playVideo" : "pauseVideo"
        }),
        "*"
      );
    });
  }, { threshold: 0.75 });

  observer.observe(el);
}

// --------------------
// SINGLE LOAD INIT (FIXED)
// --------------------
window.addEventListener("load", () => {
  initPi();
  initFeed();
});