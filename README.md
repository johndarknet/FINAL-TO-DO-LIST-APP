# MY TO DO LIST

Simple static to-do list with:
- checkbox to mark tasks done
- due date input
- "DUE SOON" badge for tasks within 24 hours
- success popup: "keep up the goodwork" when completed
- angry popup + desktop notification when tasks near due date
- stores tasks in `localStorage`

## Files
- `index.html` — page
- `style.css` — styles
- `script.js` — app logic

## Install / Deploy
1. Push these files to your GitHub repository root.
2. Enable GitHub Pages (Repository → Settings → Pages) or use existing Pages config. GitHub Pages serves the `main` branch by default.
3. After merging, wait ~1 minute and open your Pages URL.

## Test
- Add a task and set due date to today to trigger the DUE SOON behavior.
- Mark a task complete to see the success popup.
- Allow browser notifications when prompted to receive desktop reminders.

## Notes
- To change reminder lead time, edit `nearMs` in `script.js` (default 24 hours).
- If your `index.html` uses different element IDs, update `script.js` accordingly.
