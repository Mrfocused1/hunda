# 📸 Screenshot Sharing Guide

## The Problem

When you drag/drop or paste images into the terminal, macOS saves them to temporary folders (`/var/folders/...`) that Claude Code **cannot access**. Claude can only see files within your project directory.

## The Solution

I've created an automated screenshot tool that saves directly to your project folder.

---

## Quick Start

### Option 1: Use the Screenshot Tool (Recommended)

```bash
npm run screenshot
```

This will:
1. Prompt you to select an area to capture
2. Save the screenshot to `screenshots/user/`
3. Tell you the exact path to reference

### Option 2: Manual Save

1. Take your screenshot (Cmd+Shift+4)
2. Save it to: `screenshots/user/` folder in this project
3. Tell Claude: "Look at screenshots/user/your-image.png"

---

## Usage Examples

### Capture a Screenshot
```bash
npm run screenshot
```
Output:
```
📸 Screenshot Capture
=====================

Press Enter to start capture...

✅ Screenshot saved successfully!
📁 File: screenshots/user/screenshot_2025-03-25_14-30-22.png

💡 You can now tell Claude:
   "Look at screenshots/user/screenshot_2025-03-25_14-30-22.png"
```

### View Recent Screenshots
```bash
npm run screenshot:view
```

### Reference in Chat
Once saved, you can tell me:
- `"Check screenshots/user/latest.png"` (always the most recent)
- `"Look at screenshots/user/screenshot_2025-03-25_14-30-22.png"`
- `"Review the screenshot in the screenshots folder"`

---

## Why This Works

| Method | Location | Claude Can See? |
|--------|----------|-----------------|
| Drag to Terminal | `/var/folders/...` | ❌ No |
| Copy/Paste | `/var/folders/...` | ❌ No |
| **Save to Project** | `./screenshots/user/` | ✅ **Yes** |
| **Use `npm run screenshot`** | `./screenshots/user/` | ✅ **Yes** |

---

## Alternative: Just Describe It

If screenshot sharing is tricky, you can always:
1. **Describe what you see** - "The header is duplicated on mobile"
2. **Tell me the page** - "On the About page, mobile view"
3. **Be specific** - "The second product card is cut off on the right"

I can then capture automated screenshots myself using Puppeteer.

---

## Tips for Best Results

1. **Use the tool**: `npm run screenshot` is the fastest way
2. **Use "latest.png"**: After capturing, reference `screenshots/user/latest.png`
3. **Keep it in the project**: Any image in the project folder works
4. **Name descriptively**: `screenshots/user/header-bug.png` is clearer than random names

---

## Troubleshooting

### "Command not found"
```bash
# Make sure you're in the project directory
cd /Users/paulbridges/Desktop/1hundred/hunda
npm run screenshot
```

### "screencapture: command not found" (macOS)
This is built into macOS. If missing, use Cmd+Shift+4 and manually save to `screenshots/user/`.

### "Cannot see the screenshot"
Make sure you reference the correct path:
- ❌ `/var/folders/dd/.../image.png` (temporary - I can't see this)
- ✅ `screenshots/user/image.png` (project folder - I CAN see this)

---

## Summary

**Before:** Drag image to terminal → Saved to temp folder → I can't see it

**After:** Run `npm run screenshot` → Saved to project → I can see it immediately

This saves time and eliminates the back-and-forth!
