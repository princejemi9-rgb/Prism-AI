- [ ] Confirm current code uses ⋯ menu with prompt-based E/D flow for edit/delete on Profile grid
- [ ] Replace prompt flow with a bottom-sheet menu UI: Edit Caption / Delete Post / Cancel
- [ ] Wire menu buttons to existing Supabase update/delete logic (saveEditPost/deletePost)
- [ ] Ensure Delete asks for confirmation (confirm dialog or in-sheet confirmation)
- [ ] Keep menu usable only for user-owned posts
- [ ] Verify locally: Profile → tap ⋯ → menu appears → Edit updates row → Delete removes row
- [ ] Fix localhost/test: run static app via `npm run dev` and avoid EADDRINUSE port conflicts
- [ ] Only after verification: push/deploy

