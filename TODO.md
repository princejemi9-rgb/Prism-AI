- [ ] Update root `index.html`: ensure bottom nav is Home/Hot/Create(Me)/Me only (centered + button), no Tip item.
- [ ] Update root `app.js`: 
  - [x] Ensure only one floating Tip button per video card.
  - [x] Replace phone upload XHR logic with Supabase Storage upload to bucket `videos`, then save returned public URL to `posts.video_url`.
  - [ ] Preserve YouTube URL upload and embed conversion.
- [ ] Update root `style.css`: 
  - [x] Make video cards full-screen mobile-first (TikTok/Reels style) with proper scroll-snap.
  - [x] Reposition overlay title/creator and action buttons so they overlay the video area correctly.
  - [x] Compact/modern glass/dark bottom nav.


- [ ] Run quick sanity check by starting dev server / opening index.html.
- [ ] Provide Supabase Storage setup instructions (bucket + public access / policies).
