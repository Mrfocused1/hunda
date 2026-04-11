# Managing the Media Page — Admin Guide

## Getting in

1. Go to **https://www.1hundredornothing.co.uk/admin-login**
2. Sign in with your admin credentials
3. Once you're in the dashboard, look at the left sidebar
4. Click **"Media"** (image icon, below "Content")

## Uploading photos or videos

1. In the Media section, click the **"Upload"** button (top right of the Gallery Items box)
2. Pick one or more files from your computer — both images (JPG, PNG, WebP) and videos (MP4, MOV) work
3. You can select multiple files at once by holding ⌘ (Mac) or Ctrl (Windows) while clicking
4. Click **Open**
5. Wait for the upload — you'll see a progress message like *"Uploading file.jpg (1/3)…"*
6. When it's done, the new items appear in the grid below

## Removing an item

1. Hover over (or tap) the media item you want to remove
2. Click the small **trash icon** in the top-right corner of the item
3. Confirm the popup
4. The item disappears from both the admin and the public Media page instantly

## Showing or hiding the Media link in the site menu

This is the important one — it controls whether visitors to the site see a "Media" link in the main navigation (desktop header and mobile menu).

At the very top of the Media section you'll see a box that says:

> **Show Media link in site menu**
> When on, the "Media" link appears in the main navigation of every public page.
> *[ toggle switch ]*

- **Switch ON** (dark, slider on right) → the "Media" link appears immediately in the site menu for all visitors
- **Switch OFF** (grey, slider on left) → the "Media" link disappears from the site menu; the `/media` page still exists but nobody can find it via the nav

Just click the toggle to switch it. No save button — it updates live.

## Tips

- **Order matters**: items display in the order they were uploaded (oldest first). If you want a specific order, upload in that order.
- **Videos autoplay on click**: on the public Media page, visitors see a thumbnail with a play icon. Clicking opens a full-screen lightbox that plays the video.
- **File size**: keep images under ~5 MB and videos under ~30 MB for fast loading. Very large files still upload but will slow the page for visitors.
- **Cache**: if you've just toggled the menu on/off and don't see the change on the public site, do a hard refresh (⇧⌘R on Mac, Ctrl+Shift+R on Windows).
- **Changes are live instantly** — no deploy, no waiting. Every edit in the Media tab updates the public `/media` page in real time.

## Troubleshooting

| Problem | Fix |
|---|---|
| *"Supabase not loaded"* error in the Media tab | Hard-refresh the admin page and try again |
| Upload fails | Check the file is actually an image or video, and under 50 MB |
| Toggle switch won't stay on | Database setup may not be complete — contact your developer |
| Media link still missing from the site after toggling on | Hard refresh the site page; if still missing, contact your developer |
| Uploaded item doesn't appear | Refresh the admin page; if still missing, re-upload |
