# Project Status

## Current Architecture

- Single-page web app using vanilla HTML/CSS/JavaScript.
- `index.html` loads the Pi SDK and Supabase JS client via CDN.
- `app.js` contains the application logic, including Pi login/auth, Supabase video loading, feed rendering, and tipping behavior.
- `style.css` defines the UI styling, including the top bar, full-screen feed layout, and video cards.
- The feed uses a vertical, TikTok-style scroll layout with `scroll-snap-type: y mandatory`.
- Video content is rendered as iframe embeds, with autoplay control attempted through `postMessage` commands.
- Supabase integration fetches data from the `posts` table and falls back to hardcoded videos when needed.

## Completed Features

- Pi SDK initialization and authentication with `username` and `payments` scopes.
- Login/logout flow and a visible login button in the top bar.
- Tipping using `Pi.createPayment(...)` with a fixed amount and memo.
- Supabase video feed loading from the `posts` table.
- Fallback hardcoded videos when Supabase is unavailable or returns no usable rows.
- TikTok-style vertical feed with:
  - full-screen video cards,
  - smooth snap scrolling,
  - autoplay of the visible video,
  - pausing videos that leave the viewport.
- Existing UI shell remains intact, including the splash screen and bottom nav bar.

## Current Supabase Schema

- Expected table: `posts`
- Expected columns accessed in the app:
  - `id`
  - `created_at`
  - `title`
  - `creator`
  - `video_url`

## Next Tasks

1. Validate and adjust autoplay behavior across Pi Browser and mobile browsers.
2. Add native video player support or a fallback for non-responsive iframe autoplay if required.
3. Improve load-more behavior by prefetching additional rows from Supabase rather than cycling the same list.
4. Add error UI for Supabase fetch failures and empty feed states.
5. Extend the Supabase schema with metadata fields like `description`, `likes`, `comments`, and `category`.
6. Add user profile / authenticated actions in the UI for logged-in Pi users.
