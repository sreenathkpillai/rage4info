# RAGE4INFO Admin Panel Guide

A guide for content editors (no technical knowledge needed).

**Admin panel:** `http://<site>/apps/rage4info/admin`

---

## 1. Logging In

1. Go to the admin panel URL. If you are not logged in, you'll land on the login page.
2. Enter the admin email and password (ask your site administrator — they are no longer displayed on the page, for security).
3. Click **Sign In**.

Your login lasts 24 hours. If you've been logged in a while and edits stop saving with a "session has expired" message, click **Logout** and sign back in.

---

## 2. How Saving Works (Important!)

- **Everything saves automatically.** About 2 seconds after you stop typing, your edit is saved. You never need to find a Save button.
- The status bar at the bottom shows what's happening:
  - `● Editing... (saves automatically)` — you have fresh edits; they'll save in a moment.
  - `⟳ Saving your edits...` — saving right now.
  - `✓ All edits saved` — everything is stored.
  - `⚠ Save Failed` — something went wrong (usually your login expired — log out and back in, then redo your last change).

### "Published" vs. "Saved" — they are different things

- **Saved** = your edit is stored in the database. This always happens, automatically.
- **Published** (the checkbox) = whether that tab/section/item **appears on the public site**.

So if you want to work on something without visitors seeing your half-finished edits: **uncheck Published**, edit at your own pace (it keeps auto-saving), then **check Published** when you're happy with it.

---

## 3. Editing Content

1. Pick a page at the top of the left sidebar: **Landing Page**, **Caregiver**, or **Care Recipient**.
2. The left tree shows Tabs → Sections → Content Items. Click anything to open it in the editor on the right.
3. Edit the title, content, sources, etc. It saves automatically.

**In the content editor you can:**
- Make text bold/italic, change color
- Change text size (the **font size dropdown** in the toolbar)
- Make headings (the **blocks/paragraph dropdown**)
- **Insert links**: select the text, click the link (chain) button, paste the URL
- Make bulleted or numbered lists
- Undo any mistake (↶ arrow, or Ctrl/Cmd+Z)

**Sources box:** paste web addresses (one per line). They automatically become clickable links on the public site.

---

## 4. Adding and Deleting

- **New Tab**: button at the top of the sidebar tree.
- **Add Section**: expand a tab in the tree, click the dashed "Add Section" button under its sections.
- **Add Item**: inside a section, click the dashed "Add Item" button.
- **Delete**: open any tab/section/item and use the red **Delete** button at the bottom of the editor. You'll be asked to confirm. *Deleting cannot be undone.*

Changes appear in the tree **immediately** — no refresh needed.

---

## 5. Reordering (Drag and Drop)

Grab the small grip handle (⠿) on the left edge of any tab, section, or item in the tree and drag it up or down. The new order saves automatically and is reflected on the public site.

---

## 6. Editing the Landing Page

Click **Landing Page** at the top of the sidebar. You can edit:

- **Hero title and subtitle** (the big text at the top of the site)
- For each card (Caregiver and Care Recipient):
  - Title, description, and button text
  - **Card icon** — the large symbol at the top of the card, chosen from a dropdown icon library (with live preview)
  - **The three feature rows** — each row's icon (dropdown) and text

Everything saves automatically and shows on the public homepage right away.

---

## 7. Backups (Export / Import)

- **Export** (top right): downloads the entire site content as a file (`content-backup.json`). Do this before making big changes — it's your safety net.
- **Import**: restores content from a previously exported file. ⚠️ This **replaces all current content** — only use it to recover from a mistake.

---

## 8. Tips

- Links in content open in a new tab for visitors automatically.
- The public site has a light/dark theme toggle; your content works in both.
- If the tab bar on Caregiver/Care Recipient pages has more tabs than fit, visitors see **arrow buttons** to scroll them (and can swipe on phones).
- The **IRIS Program** item (Care Recipient → Direct Care → Independent Living Options) is formatted exactly as desired — avoid re-editing it.
