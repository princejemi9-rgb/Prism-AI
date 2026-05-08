// --------------------
// GLOBALS
// --------------------

let currentUser = null;
let feed;
let videos = [];
let index = 0;

// --------------------
// SUPABASE
// --------------------

const SUPABASE_URL =
  "https://qnkmaxjzjdegqnjceosk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_-YQSJlDLTKBUNxtfPhaFEQ_GjpNZYSq";

const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

// --------------------
// APP START
// --------------------

window.addEventListener(
  "load",
  async () => {

    feed =
      document.getElementById("feed");

    // SPLASH
    setTimeout(() => {

      const splash =
        document.getElementById(
          "splash"
        );

      if (splash) {

        splash.style.opacity = "0";

        setTimeout(() => {

          splash.style.display =
            "none";

        }, 1000);

      }

    }, 3000);

    // PI INIT
    initPi();

    // AUTO LOGIN
    await autoLogin();

    // TEST DATABASE
    await testSupabase();

    // LOAD POSTS
    await loadPosts();

  }
);

// --------------------
// TEST SUPABASE
// --------------------

async function testSupabase() {

  const { data, error } =
    await supabase
      .from("posts")
      .select("*");

  if (error) {

    console.error(
      "Supabase Error:",
      error
    );

  } else {

    console.log(
      "Supabase Connected:",
      data
    );

  }

}

// --------------------
// LOAD POSTS
// --------------------

async function loadPosts() {

  const { data, error } =
    await supabase
      .from("posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      "Load Posts Error:",
      error
    );

    return;

  }

  videos = data.map(post => ({

    id: post.id,

    title: post.title,

    creator: post.creator,

    url: post.video_url

  }));

  feed.innerHTML = "";

  index = 0;

  if (videos.length === 0) {

    feed.innerHTML = `
      <div style="
        padding:40px;
        text-align:center;
        color:white;
      ">
        No posts yet
      </div>
    `;

    return;

  }

  initFeed();

}

// --------------------
// PI INIT
// --------------------

function initPi() {

  if (!window.Pi) {

    console.error(
      "Pi SDK not detected"
    );

    return;

  }

  try {

    window.Pi.init({
      version: "2.0",
      sandbox: true
    });

    console.log(
      "Pi SDK initialized"
    );

  } catch (err) {

    console.error(
      "Pi Init Error:",
      err
    );

  }

}

// --------------------
// AUTO LOGIN
// --------------------

async function autoLogin() {

  try {

    if (!window.Pi) return;

    const scopes = [
      "username",
      "payments"
    ];

    function onIncompletePaymentFound(
      payment
    ) {

      console.log(payment);

    }

    const auth =
      await window.Pi.authenticate(
        scopes,
        onIncompletePaymentFound
      );

    currentUser = auth.user;

    console.log(
      "Authenticated:",
      auth.user.username
    );

    updateAuthButton();

  } catch (err) {

    console.log(
      "Auto login skipped"
    );

  }

}

// --------------------
// LOGIN
// --------------------

async function login() {

  try {

    if (!window.Pi) {

      alert(
        "Open inside Pi Browser"
      );

      return;

    }

    const scopes = [
      "username",
      "payments"
    ];

    function onIncompletePaymentFound(
      payment
    ) {

      console.log(payment);

    }

    const auth =
      await window.Pi.authenticate(
        scopes,
        onIncompletePaymentFound
      );

    currentUser = auth.user;

    alert(
      "Welcome @" +
      auth.user.username
    );

    updateAuthButton();

  } catch (err) {

    console.error(
      "AUTH ERROR:",
      err
    );

    alert(
      "Login failed: " +
      err.message
    );

  }

}

// --------------------
// UPDATE BUTTON
// --------------------

function updateAuthButton() {

  const authBtn =
    document.getElementById(
      "authBtn"
    );

  if (!authBtn) return;

  if (currentUser) {

    authBtn.innerText =
      "Logout";

    authBtn.onclick =
      logout;

  } else {

    authBtn.innerText =
      "Login";

    authBtn.onclick =
      login;

  }

}

// --------------------
// LOGOUT
// --------------------

function logout() {

  currentUser = null;

  updateAuthButton();

  alert("Logged out");

}

// --------------------
// TIP
// --------------------

function tip() {

  if (!window.Pi) {

    alert(
      "Pi SDK unavailable"
    );

    return;

  }

  window.Pi.createPayment({

    amount: 0.05,

    memo:
      "Support @prince_AI",

    metadata: {
      type: "tip"
    }

  }, {

    onReadyForServerApproval:
      function(paymentId) {

      console.log(paymentId);

    },

    onReadyForServerCompletion:
      function(paymentId, txid) {

      console.log(
        paymentId,
        txid
      );

    },

    onCancel:
      function(paymentId) {

      console.log(paymentId);

    },

    onError:
      function(error) {

      console.error(error);

    }

  });

}

// --------------------
// RENDER
// --------------------

function render(video) {

  const div =
    document.createElement("div");

  div.className =
    "video-container";

  div.innerHTML = `
  
    <iframe
      src="${video.url}"
      allow="autoplay"
      allowfullscreen>
    </iframe>

    <div class="overlay">

      <h1>
        ${video.title}
      </h1>

      <p>
        @${video.creator}
      </p>

    </div>

    <div class="actions">

      <button onclick="tip()">
        💰 Tip
      </button>

    </div>

  `;

  feed.appendChild(div);

  observe(div);

}

// --------------------
// LOAD MORE
// --------------------

function loadMore() {

  if (
    videos.length === 0
  ) return;

  render(
    videos[
      index % videos.length
    ]
  );

  index++;

}

// --------------------
// INIT FEED
// --------------------

function initFeed() {

  const count =
    Math.min(
      videos.length,
      3
    );

  for (
    let i = 0;
    i < count;
    i++
  ) {

    loadMore();

  }

}

// --------------------
// SCROLL LOAD
// --------------------

window.addEventListener(
  "scroll",
  () => {

    if (

      window.innerHeight +
      window.scrollY >=

      document.body.offsetHeight
      - 200

    ) {

      loadMore();

    }

  }
);

// --------------------
// AUTO PLAY
// --------------------

function observe(el) {

  const iframe =
    el.querySelector("iframe");

  const observer =
    new IntersectionObserver(

      entries => {

        entries.forEach(e => {

          if (!iframe) return;

          iframe.contentWindow
            .postMessage(

              JSON.stringify({

                event:
                  "command",

                func:
                  e.isIntersecting
                    ? "playVideo"
                    : "pauseVideo"

              }),

              "*"

            );

        });

      },

      {
        threshold: 0.75
      }

    );

  observer.observe(el);

}