// --------------------
// GLOBALS
// --------------------

let currentUser = null;
let feed;

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
// APP START
// --------------------

window.addEventListener("load", async () => {

  feed = document.getElementById("feed");

  initFeed();

  // SPLASH REMOVE
  setTimeout(() => {
    const splash = document.getElementById("splash");
    if (splash) splash.style.display = "none";
  }, 2500);

  // PI SDK INIT
  try {

    if (!window.Pi) {
      alert("Open inside Pi Browser");
      return;
    }

    await window.Pi.init({
      version: "2.0",
      sandbox: false
    });

    console.log("Pi SDK initialized");

  } catch (err) {
    console.error("Pi Init Error:", err);
  }

});

// --------------------
// LOGIN
// --------------------

async function login() {

  try {

    if (!window.Pi) {
      alert("Please open inside Pi Browser");
      return;
    }

    const auth = await window.Pi.authenticate(
      ['username', 'payments']
    );

    currentUser = auth.user;

    alert("Welcome @" + auth.user.username);

    const authBtn = document.getElementById("authBtn");

    authBtn.innerText = "Logout";
    authBtn.onclick = logout;

  } catch (err) {

    console.error(err);

    alert("Login failed: " + err.message);

  }

}

// --------------------
// LOGOUT
// --------------------

function logout() {

  currentUser = null;

  const authBtn = document.getElementById("authBtn");

  authBtn.innerText = "Login";
  authBtn.onclick = login;

  alert("Logged out");

}

// --------------------
// TIP PAYMENT
// --------------------

function tip() {

  if (!window.Pi) return;

  window.Pi.createPayment({

    amount: 0.05,
    memo: "Support @prince_AI",
    metadata: {
      type: "tip"
    }

  }, {

    onReadyForServerApproval: function(paymentId) {
      console.log(paymentId);
    },

    onReadyForServerCompletion: function(paymentId, txid) {
      console.log(paymentId, txid);
    },

    onCancel: function(paymentId) {
      console.log(paymentId);
    },

    onError: function(error, payment) {
      console.error(error);
    }

  });

}

// --------------------
// RENDER VIDEO
// --------------------

function render(video) {

  const div = document.createElement("div");

  div.className = "video-container";

  div.innerHTML = `
  
    <iframe
      src="${video.url}"
      allow="autoplay"
      allowfullscreen>
    </iframe>

    <div class="overlay">
      <h1>${video.title}</h1>
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

  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200
  ) {

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
          func: e.isIntersecting
            ? "playVideo"
            : "pauseVideo"
        }),
        "*"
      );

    });

  }, {
    threshold: 0.75
  });

  observer.observe(el);

}