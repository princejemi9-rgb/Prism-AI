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

    const activeTab = document.querySelector(".tab-content.active");
    if (!activeTab) return;

    const isPhoneTab = activeTab.id === "phone-tab";

    if (isPhoneTab) {
      await handlePhoneVideoUpload();
    } else {
      await handleYouTubeUpload();
    }

    // Keep modal open only if upload handlers threw; otherwise they close themselves

  }

  async function handlePhoneVideoUpload() {
    const titleField = uploadForm.querySelector("[name=title]");
    const creatorField = uploadForm.querySelector("[name=creator]");
    const videoFile = uploadForm.querySelector("[name=video_file]");

    const SUPABASE_STORAGE_BUCKET = "videos";
    const SUPABASE_STORAGE_PUBLIC_FOLDER = "uploads";

    const title = String(titleField?.value || "").trim();
    const creator = String(creatorField?.value || "").trim();
    const file = videoFile?.files?.[0];

    if (!title || !creator || !file) {
      showDebug("Phone upload failed: title, creator, and video file are required.");
      return;
    }

    if (!file.type.startsWith("video/")) {
      showDebug("Upload failed: selected file must be a video.");
      return;
    }

    try {
      const submitButton = uploadForm.querySelector("button[type=submit]");
      const progressDiv = document.getElementById("uploadProgress");
      const progressFill = document.getElementById("progressFill");
      const progressText = document.getElementById("progressText");

      if (submitButton) submitButton.disabled = true;
      if (progressDiv) progressDiv.style.display = "block";

      // Upload video file to Supabase Storage
      const fileName = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9._-]/g, "");
      const objectPath = (SUPABASE_STORAGE_PUBLIC_FOLDER ? SUPABASE_STORAGE_PUBLIC_FOLDER + "/" : "") + fileName;
      const client = getSupabaseClient();

      // Supabase-js v2 storage upload
      if (progressText) progressText.textContent = "Uploading to Storage...";

      const uploadResult = await client.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(objectPath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      // Get a public URL
      const { data: publicUrlData, error: publicUrlError } = client.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(objectPath);

      if (publicUrlError) {
        throw publicUrlError;
      }

      const publicUrl = publicUrlData.publicUrl;

      if (progressFill) progressFill.style.width = "100%";
      if (progressText) progressText.textContent = "Saving to database...";

      // Save post metadata to Supabase
      await insertSupabasePost({
        title: title,
        creator: creator,
        video_url: publicUrl
      });

      if (progressDiv) progressDiv.style.display = "none";
      closeUploadModal();
      refreshFeed();

      showDebug("Video uploaded successfully!");
    } catch (error) {
      showDebug("Phone upload failed:\n" + formatError(error));
    } finally {
      const submitButton = uploadForm.querySelector("button[type=submit]");
      if (submitButton) submitButton.disabled = false;
      const progressDiv = document.getElementById("uploadProgress");
      if (progressDiv) progressDiv.style.display = "none";
    }
  }

  async function handleYouTubeUpload() {
    const titleField = uploadForm.querySelector("[name=title2]");
    const creatorField = uploadForm.querySelector("[name=creator2]");
    const urlField = uploadForm.querySelector("[name=video_url]");

    const title = String(titleField?.value || "").trim();
    const creator = String(creatorField?.value || "").trim();
    const videoUrl = String(urlField?.value || "").trim();

    if (!title || !creator || !videoUrl) {
      showDebug("YouTube upload failed: title, creator, and video URL are required.");
      return;
    }

    const embedUrl = convertToEmbedUrl(videoUrl);
    if (!embedUrl) {
      showDebug("YouTube upload failed: invalid YouTube URL.");
      return;
    }

    try {
      const submitButton = uploadForm.querySelector("button[type=submit]");
      if (submitButton) submitButton.disabled = true;

      await insertSupabasePost({
        title: title,
        creator: creator,
        video_url: embedUrl
      });

      closeUploadModal();
      refreshFeed();
      showDebug("Video added successfully!");
    } catch (error) {
      showDebug("YouTube upload failed:\n" + formatError(error));
    } finally {
      const submitButton = uploadForm.querySelector("button[type=submit]");
      if (submitButton) submitButton.disabled = false;
    }
  }

  function setupTabHandlers() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    if (!tabButtons.length) return;

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const tabName = btn.getAttribute("data-tab");
        if (!tabName) return;

        // Hide all tabs and remove active class
        document.querySelectorAll(".tab-content").forEach(function (tab) {
          tab.classList.remove("active");
        });
        document.querySelectorAll(".tab-btn").forEach(function (b) {
          b.classList.remove("active");
        });

        // Show selected tab and add active class
        const tabContent = document.getElementById(tabName + "-tab");
        if (tabContent) {
          tabContent.classList.add("active");
          btn.classList.add("active");

          // Clear form fields when switching tabs
          if (tabName === "phone") {
            uploadForm.querySelector("[name=title2]").value = "";
            uploadForm.querySelector("[name=creator2]").value = "";
            uploadForm.querySelector("[name=video_url]").value = "";
          } else {
            uploadForm.querySelector("[name=title]").value = "";
            uploadForm.querySelector("[name=creator]").value = "";
            uploadForm.querySelector("[name=video_file]").value = "";
          }
        }
      });
    });
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
    if (!iframe) return;

    // Only YouTube needs the postMessage commands.
    // Uploaded storage videos should be normal <video> elements (handled elsewhere).
    // This function is kept for backward compatibility with Home/Viewer iframe videos.
    sendIframeCommand(iframe, "playVideo");
  }

  function pauseIframe(iframe) {
    if (!iframe) return;
    sendIframeCommand(iframe, "pauseVideo");
  }

  function looksLikeYoutube(url) {
    if (!url || typeof url !== "string") return false;
    return /(^|\.)youtube\.com|(^|\.)youtu\.be/i.test(url);
  }

  function looksLikeDirectVideo(url) {
    // For Supabase uploaded assets we typically get a public URL to the media file.
    // Treat common media file extensions as direct videos.
    if (!url || typeof url !== "string") return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  }

  function isDirectStorageOrMediaUrl(url) {
    if (!url || typeof url !== "string") return false;
    // Supabase public URLs are often direct to the file; also support any common media extension.
    return looksLikeDirectVideo(url);
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

        // Ensure JS API works for play/pause commands.
        url.searchParams.set("enablejsapi", "1");
        url.searchParams.set("mute", "1");

        // IMPORTANT: keep grid non-autoplay. Viewer explicitly calls playIframe().
        // YouTube can still autoplay based on embed policies; removing autoplay requests helps.
        url.searchParams.delete("autoplay");
        url.searchParams.delete("start");
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

  async function loadProfileVideos() {
    const grid = document.getElementById("profile-grid");
    const empty = document.getElementById("profile-grid-empty");
    if (!grid) return;

    grid.innerHTML = "";
    if (empty) empty.hidden = false;

    let posts = [];
    try {
      posts = await loadSupabaseVideos();
    } catch (e) {
      posts = [];
    }

    const username = state.currentUser && state.currentUser.username ? state.currentUser.username : null;
    const filtered = username ? posts.filter(function (p) {
      return p.creator === username;
    }) : posts;

    const list = (filtered && filtered.length ? filtered : posts).slice(0, 12);

    if (!list.length) return;

    if (empty) empty.hidden = true;

    list.forEach(function (video, idx) {
      const item = document.createElement("div");
      item.className = "grid-item";
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.dataset.postId = video.id;
      item.dataset.creator = video.creator;
      item.dataset.title = video.title;
      item.dataset.url = video.url;

      // Thumbnail-only: do NOT render iframe/video inside grid.
      // Clicking a thumbnail opens the full-screen TikTok/Reels viewer.
      const thumb = document.createElement("div");
      thumb.className = "grid-thumb";

      const overlayPlay = document.createElement("div");
      overlayPlay.className = "grid-thumb-play";
      overlayPlay.textContent = "▶";

      const thumbMeta = document.createElement("div");
      thumbMeta.className = "grid-thumb-meta";
      thumbMeta.textContent = video.title ? String(video.title).slice(0, 18) : "";

      thumb.appendChild(overlayPlay);
      thumb.appendChild(thumbMeta);

      const menu = document.createElement("button");
      menu.type = "button";
      menu.className = "grid-menu";
      menu.textContent = "⋯";
      menu.style.display = "none";
      menu.addEventListener("click", function (e) {
        e.stopPropagation();
        openPostMenu(video);
      });

      item.addEventListener("click", function () {
        // Ensure viewer swipe list is exactly the tapped creator’s videos.
        openProfileViewerForPost(video, list, idx);
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProfileViewerForPost(video, list, idx);
        }
      });

      // Show menu only for your own posts
      if (username && video.creator === username) {
        menu.style.display = "flex";
      }

      item.appendChild(thumb);
      item.appendChild(menu);
      grid.appendChild(item);
    });

  }

  // --------------------
  // PROFILE VIEWER + MANAGEMENT
  // --------------------
  const viewerState = {
    open: false,
    creatorVideos: [],
    startIndex: 0,
    activeContainer: null,
    observer: null,
    currentPost: null
  };

  function getEl(id) {
    return document.getElementById(id);
  }

  function pauseAllViewerIframesAndVideos() {
    const feedEl = getEl("viewer-feed");
    if (!feedEl) return;

    // Pause YouTube iframes (existing postMessage mechanism)
    const iframes = feedEl.querySelectorAll("iframe");
    iframes.forEach(function (iframe) {
      pauseIframe(iframe);
    });

    // Pause direct <video> elements for Supabase Storage uploads
    const videos = feedEl.querySelectorAll("video");
    videos.forEach(function (videoEl) {
      try {
        videoEl.pause();
        // release some memory
        videoEl.currentTime = 0;
      } catch (e) {
        // ignore
      }
    });
  }


  function showViewerUI(show) {
    const backdrop = getEl("profile-viewer-backdrop");
    if (!backdrop) return;

    if (show) {
      backdrop.hidden = false;
      backdrop.style.display = "block";
      document.body.style.overflow = "hidden";
    } else {
      backdrop.hidden = true;
      backdrop.style.display = "none";
      document.body.style.overflow = "hidden";
    }

  }



  function updateViewerMeta(video) {
    const creatorEl = getEl("viewer-creator");
    const titleEl = getEl("viewer-title");

    if (creatorEl) creatorEl.textContent = "@" + (video.creator || "prince_AI");
    if (titleEl) titleEl.textContent = video.title || "Untitled video";
  }

  function createViewerObserver(viewerFeedEl) {
    if (viewerState.observer) {
      viewerState.observer.disconnect();
      viewerState.observer = null;
    }

    if (!viewerFeedEl || typeof IntersectionObserver !== "function") return;

    viewerState.observer = new IntersectionObserver(function (entries) {
      if (!entries || !entries.length) return;

      const mostVisible = entries.reduce(function (best, entry) {
        return (!best || entry.intersectionRatio > best.intersectionRatio) ? entry : best;
      }, null);

      if (!mostVisible) return;

      entries.forEach(function (entry) {
        const container = entry.target;

        const iframe = container.querySelector("iframe");
        const videoEl = container.querySelector("video");

        const shouldPlay = container === mostVisible.target && mostVisible.intersectionRatio >= 0.6;
        if (shouldPlay) {
          if (viewerState.activeContainer !== container) {
            // Start/Resume
            if (iframe) {
              playIframe(iframe);
            } else if (videoEl) {
              try {
                // Some browsers need an explicit play() call.
                videoEl.currentTime = 0;
                const p = videoEl.play();
                if (p && typeof p.then === "function") {
                  p.catch(function () {
                    // ignore autoplay errors
                  });
                }
              } catch (e) {
                // ignore
              }
            }

            viewerState.activeContainer = container;

            const idxStr = container.getAttribute("data-index");
            const idx = idxStr ? Number(idxStr) : 0;
            const post = viewerState.creatorVideos[idx];
            if (post) {
              viewerState.currentPost = post;
              updateViewerMeta(post);
            }
          }
        } else {
          // Pause
          if (iframe) {
            pauseIframe(iframe);
          } else if (videoEl) {
            try {
              videoEl.pause();
            } catch (e) {
              // ignore
            }
          }
        }
      });

    }, {
      root: viewerFeedEl,
      threshold: [0.5, 0.75, 1]
    });
  }

  function renderViewerFeed(tappedVideos, startIndex) {
    const viewerFeedEl = getEl("viewer-feed");
    if (!viewerFeedEl) return;

    viewerFeedEl.innerHTML = "";

    viewerState.creatorVideos = tappedVideos || [];
    viewerState.startIndex = startIndex || 0;
    viewerState.currentPost = viewerState.creatorVideos[viewerState.startIndex] || null;
    viewerState.activeContainer = null;

    if (viewerState.creatorVideos.length === 0) return;

    viewerState.creatorVideos.forEach(function (video, idx) {
      const item = document.createElement("div");
      item.className = "viewer-video";
      item.setAttribute("data-index", String(idx));

      // YouTube => iframe (postMessage play/pause)
      if (looksLikeYoutube(video.url)) {
        const iframe = document.createElement("iframe");
        iframe.src = normalizeVideoUrl(video.url);
        iframe.allow = "autoplay; encrypted-media; picture-in-picture";
        iframe.setAttribute("allowfullscreen", "allowfullscreen");
        iframe.loading = "lazy";
        item.appendChild(iframe);
      } else {
        // Direct video => <video> element (Supabase Storage uploads)
        const videoEl = document.createElement("video");
        videoEl.src = video.url;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = "metadata";
        videoEl.controls = false;
        videoEl.loop = false;
        videoEl.autoplay = false;
        videoEl.setAttribute("webkit-playsinline", "true");
        videoEl.setAttribute("playsinline", "true");
        videoEl.setAttribute("x5-playsinline", "true");

        // Use inline fallback: if the browser requires a play() call
        videoEl.pause();
        item.appendChild(videoEl);
      }

      viewerFeedEl.appendChild(item);


      if (viewerState.observer) {
        viewerState.observer.observe(item);
      }
    });

    // start at tapped item
    const items = viewerFeedEl.querySelectorAll(".viewer-video");
    if (items && items.length > viewerState.startIndex) {
      const target = items[viewerState.startIndex];
      // Scroll into view; snap should align.
      target.scrollIntoView({ block: "start", behavior: "instant" });
      updateViewerMeta(viewerState.creatorVideos[viewerState.startIndex]);

      // Immediate play of tapped one
      const iframe = target.querySelector("iframe");
      const videoEl = target.querySelector("video");

      if (iframe) {
        playIframe(iframe);
        viewerState.activeContainer = target;
      } else if (videoEl) {
        try {
          videoEl.currentTime = 0;
          const p = videoEl.play();
          if (p && typeof p.then === "function") {
            p.catch(function () {
              // ignore autoplay errors
            });
          }
          viewerState.activeContainer = target;
        } catch (e) {
          // ignore
        }
      }
    }

  }

  function openProfileViewerForPost(tappedVideo, creatorVideos, startIndex) {

    if (!tappedVideo || !creatorVideos || !creatorVideos.length) return;

    // creatorVideos passed from grid might include more than the tapped creator if user isn’t logged in.
    // Filter again to guarantee TikTok-style swipe stays on tapped creator’s posts only.
    const creator = tappedVideo.creator;
    const filtered = creator ? creatorVideos.filter(function (v) {
      return v && v.creator === creator;
    }) : creatorVideos;

    // Find correct start index inside the filtered list.
    let resolvedIndex = 0;
    if (filtered && filtered.length) {
      resolvedIndex = filtered.findIndex(function (v) {
        return v && v.id === tappedVideo.id;
      });
      if (resolvedIndex < 0) resolvedIndex = startIndex || 0;
    }

    viewerState.creatorVideos = filtered;

    // Setup close button + tip button once
    const closeBtn = getEl("profile-viewer-close");
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", function () {
        closeProfileViewer();
      });
    }

    const tipBtn = getEl("viewer-tip");
    if (tipBtn && !tipBtn.dataset.bound) {
      tipBtn.dataset.bound = "1";
      tipBtn.addEventListener("click", function () {
        tip();
      });
    }

    showViewerUI(true);

    const viewerFeedEl = getEl("viewer-feed");
    if (!viewerFeedEl) return;

    createViewerObserver(viewerFeedEl);
    renderViewerFeed(filtered, resolvedIndex);

    // Observe after render
    const items = viewerFeedEl.querySelectorAll(".viewer-video");
    if (viewerState.observer && items && items.length) {
      items.forEach(function (item) {
        viewerState.observer.observe(item);
      });
    }
  }

  function closeProfileViewer() {
    showViewerUI(false);
    pauseAllViewerIframesAndVideos();

    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    // Clear active container so observer doesn't race with the close.
    viewerState.activeContainer = null;

    if (viewerState.observer) {


      viewerState.observer.disconnect();
      viewerState.observer = null;
    }
    viewerState.activeContainer = null;
    viewerState.currentPost = null;
  }

  function showPostMenu(video) {
    if (!video) return;

    // Store current post so button handlers can act on it.
    viewerState.currentPost = video;

    const backdrop = getEl("postMenuBackdrop");
    const menu = getEl("postMenu");
    if (!backdrop || !menu) return;

    backdrop.hidden = false;
    menu.hidden = false;

    backdrop.style.display = "block";
    menu.style.display = "block";
  }

  function hidePostMenu() {
    const backdrop = getEl("postMenuBackdrop");
    const menu = getEl("postMenu");
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.style.display = "none";
    }
    if (menu) {
      menu.hidden = true;
      menu.style.display = "none";
    }
  }

  function openPostMenu(video) {
    // UI menu (no prompt). Buttons are defined in index.html.
    if (!video) return;
    showPostMenu(video);
  }


  function openEditPostModal(video) {
    const modal = getEl("editPostModal");
    const form = getEl("editPostForm");
    const titleInput = getEl("editPostTitle");
    if (!modal || !form || !titleInput || !video) return;

    titleInput.value = video.title || "";

    modal.hidden = false;
    modal.style.display = "flex";

    if (!form.dataset.bound) {
      form.dataset.bound = "1";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!viewerState.currentPost) return;
        saveEditPost(viewerState.currentPost);
      });
    }

    // bind cancel/close
    const cancelBtn = getEl("editPostCancelBtn");
    const closeBtn = getEl("editPostCloseBtn");

    if (cancelBtn && !cancelBtn.dataset.bound) {
      cancelBtn.dataset.bound = "1";
      cancelBtn.addEventListener("click", function () {
        closeEditPostModal();
      });
    }
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", function () {
        closeEditPostModal();
      });
    }

    viewerState.currentPost = video;
  }

  function closeEditPostModal() {
    const modal = getEl("editPostModal");
    if (!modal) return;
    modal.hidden = true;
    modal.style.display = "none";
    const titleInput = getEl("editPostTitle");
    if (titleInput) titleInput.value = "";
  }

  async function saveEditPost(post) {
    if (!post || !post.id) return;
    const titleInput = getEl("editPostTitle");
    if (!titleInput) return;

    const newTitle = String(titleInput.value || "").trim();
    if (!newTitle) {
      alert("Title cannot be empty");
      return;
    }

    try {
      const client = getSupabaseClient();
      const res = await client.from("posts").update({ title: newTitle }).eq("id", post.id);
      if (res.error) throw res.error;

      closeEditPostModal();
      await refreshFeed();
      await loadProfileVideos();
    } catch (error) {
      showDebug("Edit failed:\n" + formatError(error));
      alert("Edit failed");
    }
  }

  function extractSupabaseStorageObjectPathFromPublicUrl(publicUrl) {
    try {
      if (!publicUrl || typeof publicUrl !== "string") return null;
      const url = new URL(publicUrl);

      // Best-effort: look for /storage/v1/object/public/<bucket>/<objectPath>
      const marker = "/storage/v1/object/public/";
      const idx = url.pathname.indexOf(marker);
      if (idx === -1) return null;

      const rest = url.pathname.slice(idx + marker.length);
      const parts = rest.split("/");
      if (!parts.length) return null;
      const bucket = parts[0];
      parts.shift();
      const objectPath = parts.join("/");

      return bucket && objectPath ? { bucket: bucket, objectPath: objectPath } : null;
    } catch (e) {
      return null;
    }
  }

  async function deletePost(post) {
    if (!post || !post.id) return;
    try {
      const client = getSupabaseClient();

      // Best-effort storage removal before row delete
      const storageInfo = extractSupabaseStorageObjectPathFromPublicUrl(post.url);
      if (storageInfo && storageInfo.bucket === "videos") {
        try {
          await client.storage.from("videos").remove([storageInfo.objectPath]);
        } catch (storageErr) {
          // ignore storage errors
          showDebug("Storage delete best-effort failed:\n" + formatError(storageErr));
        }
      }

      const res = await client.from("posts").delete().eq("id", post.id);
      if (res.error) throw res.error;

      await refreshFeed();
      await loadProfileVideos();
    } catch (error) {
      showDebug("Delete failed:\n" + formatError(error));
      alert("Delete failed");
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

    // Wire Post Menu button handlers (Edit/Delete/Cancel)
    var postMenuEditBtn = document.getElementById("postMenuEditBtn");
    var postMenuDeleteBtn = document.getElementById("postMenuDeleteBtn");
    var postMenuCancelBtn = document.getElementById("postMenuCancelBtn");
    var postMenuBackdropEl = document.getElementById("postMenuBackdrop");

    if (postMenuEditBtn) {
      postMenuEditBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        hidePostMenu();
        if (viewerState.currentPost) openEditPostModal(viewerState.currentPost);
      });
    }

    if (postMenuDeleteBtn) {
      postMenuDeleteBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!viewerState.currentPost) return;
        if (confirm("Delete this post? This cannot be undone.")) {
          hidePostMenu();
          deletePost(viewerState.currentPost);
        }
      });
    }

    if (postMenuCancelBtn) {
      postMenuCancelBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        hidePostMenu();
      });
    }

    if (postMenuBackdropEl) {
      postMenuBackdropEl.addEventListener("click", function (e) {
        e.preventDefault();
        hidePostMenu();
      });
    }


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

    // Setup tab switching for upload form
    setupTabHandlers();

    // Bottom navigation (TikTok/Reels-style views)
    const navMap = {
      home: "view-home",
      friends: "view-friends",
      inbox: "view-inbox",
      profile: "view-profile"
    };

    function setActiveNav(navKey) {
      document.querySelectorAll(".nav-item, .nav-create").forEach(function (el) {
        el.classList.remove("active");
      });
      const active = document.querySelector('.nav-item[data-nav="' + navKey + '"]');
      if (active) active.classList.add("active");
    }

    function showView(viewId) {
      document.querySelectorAll(".view").forEach(function (v) {
        v.hidden = true;
        v.style.display = "none";
      });
      const target = document.getElementById(viewId);
      if (target) {
        target.hidden = false;
        target.style.display = "block";
      }

      if (viewId === "view-home") {
        initFeedOnce();
      }

      if (viewId === "view-profile") {
        loadProfileVideos();
      }
    }

    document.querySelectorAll(".nav-item").forEach(function (item) {
      item.addEventListener("click", function () {
        const nav = item.getAttribute("data-nav");
        if (!nav || !navMap[nav]) return;
        setActiveNav(nav);
        showView(navMap[nav]);
      });
    });

    // Default to Home
    showView("view-home");
    setActiveNav("home");

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

