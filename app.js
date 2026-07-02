"use strict";

(function () {
  const SUPABASE_URL = "https://wlxtvtglsrekmxbvjtpo.supabase.co";
  const SUPABASE_KEY = "sb_publishable_dEMsMVLg8NW6mIWK6kOSgA_UP4ffuPB";
  const INITIAL_VIDEO_COUNT = 3;
  const LOAD_MORE_DISTANCE = 240;

  const fallbackVideos = [
    {
      id: "1",
      title: "I share AI tools to help you work smarter and make money online",
      creator: "prince_AI",
      url: "https://www.youtube.com/embed/sRcd9fK6ECw?enablejsapi=1&mute=1"
    },
    {
      id: "2",
      title: "AI me real business",
      creator: "prince_AI",
      url: "https://www.youtube.com/embed/tfkidUX4viA?enablejsapi=1&mute=1"
    },
    {
      id: "3",
      title: "Would you hire a developer or let AI do it?",
      creator: "prince_AI",
      url: "https://www.youtube.com/embed/HEYjc91mzAs?enablejsapi=1&mute=1"
    }
  ];

  const state = {
    started: false,
    feedInitialized: false,
    feedScrollAttached: false,
    piInitAttempted: false,
    piReady: false,
    currentUser: null,
    supabaseClient: null,
    videos: fallbackVideos.slice(),
    nextVideoIndex: 0,
    videoObserver: null,
    activeVideoContainer: null
  };

  let loginBtn = null;
  let feed = null;
  let uploadBtn = null;
  let uploadModal = null;
  let uploadForm = null;
  let uploadCancelBtn = null;
  let uploadCloseBtn = null;

  function showDebug(message) {
    const text = String(message || "Unknown error");

    if (typeof window.showDebugMessage === "function") {
      window.showDebugMessage(text);
      return;
    }

    const panel = document.getElementById("debugPanel");
    if (panel) {
      panel.hidden = false;
      panel.style.display = "block";
      panel.textContent = text;
    }
  }

  function formatError(error) {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;

    const parts = [];
    if (error.message) parts.push(error.message);
    if (error.code) parts.push("Code: " + error.code);
    if (error.details) parts.push("Details: " + error.details);
    if (error.hint) parts.push("Hint: " + error.hint);
    if (error.stack) parts.push(error.stack);

    if (parts.length) return parts.join("\n");

    try {
      return JSON.stringify(error, null, 2);
    } catch (jsonError) {
      return String(error);
    }
  }

  function convertToEmbedUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") {
      return rawUrl;
    }

    var trimmed = rawUrl.trim();
    if (!trimmed) {
      return rawUrl;
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = "https://" + trimmed;
    }

    try {
      var url = new URL(trimmed);
      var host = url.hostname.toLowerCase();

      if (host.includes("youtu.be")) {
        var id = url.pathname.slice(1);
        if (id) {
          return "https://www.youtube.com/embed/" + id + "?enablejsapi=1&mute=1";
        }
      }

      if (host.includes("youtube.com")) {
        if (url.pathname.startsWith("/watch")) {
          var id = url.searchParams.get("v");
          if (id) {
            return "https://www.youtube.com/embed/" + id + "?enablejsapi=1&mute=1";
          }
        }

        if (url.pathname.startsWith("/shorts/")) {
          var id = url.pathname.split("/shorts/")[1];
          if (id) {
            return "https://www.youtube.com/embed/" + id + "?enablejsapi=1&mute=1";
          }
        }

        if (url.pathname.startsWith("/embed/")) {
          var id = url.pathname.split("/embed/")[1];
          if (id) {
            return "https://www.youtube.com/embed/" + id + "?enablejsapi=1&mute=1";
          }
        }
      }

      return rawUrl;
    } catch (error) {
      return rawUrl;
    }
  }

  function getPi() {
    return window.Pi;
  }

  function initPiOnce() {
    if (state.piReady) return true;
    if (state.piInitAttempted) return false;

    const Pi = getPi();

    if (!Pi) {
      showDebug("Pi SDK did not load. Make sure https://sdk.minepi.com/pi-sdk.js is reachable in Pi Browser.");
      return false;
    }

    state.piInitAttempted = true;

    try {
      Pi.init({
        version: "2.0",
        sandbox: true
      });

      state.piReady = true;
      if (loginBtn) loginBtn.disabled = false;
      return true;
    } catch (error) {
      showDebug("Pi SDK initialization failed:\n" + formatError(error));
      return false;
    }
  }

  async function login() {
    const Pi = getPi();

    if (!state.piReady && Pi && !state.piInitAttempted) {
      initPiOnce();
    }

    if (!state.piReady || !Pi) {
      const message = "Pi SDK is not ready yet. Please open the app in Pi Browser or refresh and try again.";
      showDebug(message);
      alert(message);
      return;
    }

    try {
      const auth = await Pi.authenticate(["username", "payments"]);
      state.currentUser = auth.user;

      if (loginBtn) {
        loginBtn.textContent = "Logout";
        loginBtn.disabled = false;
      }

      alert("Welcome @" + auth.user.username);
    } catch (error) {
      const message = "Login failed:\n" + formatError(error);
      showDebug(message);
      alert("Login failed: " + formatError(error));
    }
  }

  function logout() {
    state.currentUser = null;

    if (loginBtn) {
      loginBtn.textContent = "Login";
      loginBtn.disabled = !state.piReady;
    }

    alert("Signed out");
  }

  function handleAuthClick() {
    if (state.currentUser) {
      logout();
      return;
    }

    login();
  }

  function tip() {
    const Pi = getPi();

    if (!Pi) {
      const message = "Pi SDK is not available. Tips only work inside Pi Browser.";
      showDebug(message);
      alert(message);
      return;
    }

    try {
      Pi.createPayment({
        amount: 0.05,
        memo: "Support @prince_AI",
        metadata: { type: "tip" }
      }, {
        onReadyForServerApproval: function () {},
        onReadyForServerCompletion: function () {},
        onCancel: function () {},
        onError: function (error) {
          showDebug("Payment failed:\n" + formatError(error));
        }
      });
    } catch (error) {
      showDebug("Payment failed:\n" + formatError(error));
    }
  }

  function getSupabaseClient() {
    if (state.supabaseClient) return state.supabaseClient;

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase browser client did not load from https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    state.supabaseClient = supabase;
    return supabase;
  }

  async function loadSupabaseVideos() {
    const client = getSupabaseClient();
    const response = await client
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (response.error) {
      throw response.error;
    }

    if (!response.data || response.data.length === 0) {
      showDebug("Supabase returned no rows from posts. Using the hardcoded fallback videos.");
      return [];
    }

    const videos = response.data
      .map(function (post) {
        return {
          id: post.id,
          createdAt: post.created_at,
          title: post.title || "Untitled video",
          creator: post.creator || "prince_AI",
          url: post.video_url
        };
      })
      .filter(function (video) {
        return Boolean(video.url);
      });

    if (!videos.length) {
      showDebug("Supabase returned rows from posts, but none had a usable video_url. Using the hardcoded fallback videos.");
      return [];
    }

    return videos;
  }

  function disconnectObservers() {
    if (state.videoObserver) {
      state.videoObserver.disconnect();
      state.videoObserver = null;
    }
    state.activeVideoContainer = null;
  }

  function openUploadModal() {
    if (!uploadModal || !uploadForm) return;

    uploadModal.hidden = false;
    uploadModal.classList.add("show");
    uploadForm.reset();

    window.setTimeout(function () {
      var titleField = uploadForm.querySelector("[name=title]");
      if (titleField) {
        titleField.focus();
      }
    }, 50);
  }

  function closeUploadModal() {
    if (!uploadModal) return;

    uploadModal.hidden = true;
    uploadModal.classList.remove("show");
  }

  async function refreshFeed() {
    try {
      const videos = await loadSupabaseVideos();
      if (videos.length) {
        setFeedVideos(videos);
        return;
      }
    } catch (error) {
      showDebug("Feed refresh failed:\n" + formatError(error));
    }

    setFeedVideos(fallbackVideos);
  }

  async function insertSupabasePost(post) {
    const client = getSupabaseClient();
    const response = await client.from("posts").insert([post]);
    if (response.error) {
      throw response.error;
    }
    return response.data;
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    if (!uploadForm) return;

    const formData = new FormData(uploadForm);
    const title = String(formData.get("title") || "").trim();
    const creator = String(formData.get("creator") || "").trim();
    const videoUrl = String(formData.get("video_url") || "").trim();

    if (!title || !creator || !videoUrl) {
      showDebug("Upload failed: title, creator, and video URL are required.");
      return;
    }

    const embedUrl = convertToEmbedUrl(videoUrl);
    if (!embedUrl) {
      showDebug("Upload failed: invalid YouTube URL.");
      return;
    }

    try {
      const submitButton = uploadForm.querySelector("button[type=submit]");
      if (submitButton) {
        submitButton.disabled = true;
      }

      await insertSupabasePost({
        title: title,
        creator: creator,
        video_url: embedUrl
      });

      closeUploadModal();
      refreshFeed();
    } catch (error) {
      showDebug("Upload failed:\n" + formatError(error));
    } finally {
      const submitButton = uploadForm.querySelector("button[type=submit]");
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  function setFeedVideos(videos) {
    if (!feed) return;

    const usableVideos = videos && videos.length ? videos : fallbackVideos;
    state.videos = usableVideos.slice();
    state.nextVideoIndex = 0;

    disconnectObservers();
    feed.textContent = "";

    for (let i = 0; i < INITIAL_VIDEO_COUNT; i++) {
      loadMore();
    }
  }

  function sendIframeCommand(iframe, func) {
    if (!iframe || !iframe.contentWindow) return;

    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: func,
          args: []
        }),
        "*"
      );
    } catch (error) {
      showDebug("Video autoplay message failed:\n" + formatError(error));
    }
  }

  function playIframe(iframe) {
    sendIframeCommand(iframe, "playVideo");
  }

  function pauseIframe(iframe) {
    sendIframeCommand(iframe, "pauseVideo");
  }

  function normalizeVideoUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") {
      return rawUrl;
    }

    try {
      const url = new URL(rawUrl);
      const hostname = url.hostname.toLowerCase();

      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        if (hostname === "youtu.be") {
          const videoId = url.pathname.slice(1);
          if (videoId) {
            url.hostname = "www.youtube.com";
            url.pathname = "/embed/" + videoId;
          }
        }

        if (url.pathname === "/watch") {
          const videoId = url.searchParams.get("v");
          if (videoId) {
            url.pathname = "/embed/" + videoId;
            url.searchParams.delete("v");
          }
        }

        url.searchParams.set("enablejsapi", "1");
        url.searchParams.set("mute", "1");
      }

      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  function render(video) {
    if (!feed || !video) return;

    const container = document.createElement("div");
    container.className = "video-container";

    const iframe = document.createElement("iframe");
    iframe.src = normalizeVideoUrl(video.url);
    iframe.title = video.title || "Prism AI video";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "allowfullscreen");
    iframe.loading = "lazy";

    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const title = document.createElement("h1");
    title.textContent = video.title || "Untitled video";

    const creator = document.createElement("p");
    creator.textContent = "@" + (video.creator || "prince_AI");

    overlay.appendChild(title);
    overlay.appendChild(creator);

    const actions = document.createElement("div");
    actions.className = "actions";

    const tipButton = document.createElement("button");
    tipButton.type = "button";
    tipButton.textContent = "Tip";
    tipButton.addEventListener("click", tip);

    actions.appendChild(tipButton);
    container.appendChild(iframe);
    container.appendChild(overlay);
    container.appendChild(actions);

    feed.appendChild(container);
    observe(container);
  }

  function loadMore() {
    if (!state.videos.length) {
      state.videos = fallbackVideos.slice();
    }

    render(state.videos[state.nextVideoIndex % state.videos.length]);
    state.nextVideoIndex += 1;
  }

  function handleFeedScroll() {
    if (!feed) return;

    const distanceFromBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
    if (distanceFromBottom <= LOAD_MORE_DISTANCE) {
      loadMore();
    }
  }

  function setupFeedScrollOnce() {
    if (!feed || state.feedScrollAttached) return;

    feed.addEventListener("scroll", handleFeedScroll, { passive: true });
    state.feedScrollAttached = true;
  }

  function setupVideoObserver() {
    if (state.videoObserver || typeof IntersectionObserver !== "function") {
      return;
    }

    state.videoObserver = new IntersectionObserver(function (entries) {
      if (!entries || !entries.length) {
        return;
      }

      const mostVisible = entries.reduce(function (best, entry) {
        return (!best || entry.intersectionRatio > best.intersectionRatio) ? entry : best;
      }, null);

      if (!mostVisible) {
        return;
      }

      entries.forEach(function (entry) {
        const iframe = entry.target.querySelector("iframe");
        if (!iframe) return;

        if (entry.target === mostVisible.target && mostVisible.intersectionRatio >= 0.6) {
          if (state.activeVideoContainer !== entry.target) {
            playIframe(iframe);
            state.activeVideoContainer = entry.target;
          }
        } else {
          pauseIframe(iframe);
          if (state.activeVideoContainer === entry.target) {
            state.activeVideoContainer = null;
          }
        }
      });
    }, {
      root: feed,
      threshold: [0.5, 0.75, 1]
    });
  }

  function observe(element) {
    if (!element || typeof IntersectionObserver !== "function") {
      return;
    }

    setupVideoObserver();
    if (state.videoObserver) {
      state.videoObserver.observe(element);
    }
  }

  async function initFeedOnce() {
    if (state.feedInitialized) return;

    state.feedInitialized = true;
    setupFeedScrollOnce();

    setFeedVideos(fallbackVideos);

    try {
      const supabaseVideos = await loadSupabaseVideos();

      if (supabaseVideos.length) {
        setFeedVideos(supabaseVideos);
      }
    } catch (error) {
      showDebug("Supabase failed. Using the hardcoded fallback videos.\n\n" + formatError(error));
      setFeedVideos(fallbackVideos);
    }
  }

  function hideSplashSoon() {
    window.setTimeout(function () {
      const splash = document.getElementById("splash");
      if (splash) {
        splash.style.display = "none";
      }
    }, 2500);
  }

  function startApp() {
    if (state.started) return;
    state.started = true;

    loginBtn = document.getElementById("loginBtn");
    feed = document.getElementById("feed");
    uploadBtn = document.getElementById("uploadBtn");
    uploadModal = document.getElementById("uploadModal");
    uploadForm = document.getElementById("uploadForm");
    uploadCloseBtn = document.getElementById("uploadCloseBtn");
    uploadCancelBtn = document.getElementById("uploadCancelBtn");

    if (!feed) {
      showDebug("Feed container #feed was not found. The app cannot render videos.");
      return;
    }

    if (loginBtn) {
      loginBtn.addEventListener("click", handleAuthClick);
    }

    if (uploadBtn) {
      uploadBtn.addEventListener("click", openUploadModal);
    }

    if (uploadForm) {
      uploadForm.addEventListener("submit", handleUploadSubmit);
    }

    if (uploadCloseBtn) {
      uploadCloseBtn.addEventListener("click", closeUploadModal);
    }

    if (uploadCancelBtn) {
      uploadCancelBtn.addEventListener("click", closeUploadModal);
    }

    if (uploadModal) {
      uploadModal.addEventListener("click", function (event) {
        if (event.target === uploadModal) {
          closeUploadModal();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && uploadModal && !uploadModal.hidden) {
        closeUploadModal();
      }
    });

    hideSplashSoon();
    initPiOnce();
    initFeedOnce();
  }

  window.login = login;
  window.logout = logout;
  window.tip = tip;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
})();
