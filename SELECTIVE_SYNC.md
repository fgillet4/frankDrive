# Selective Sync - Choose Which Files to Download

Save bandwidth by choosing which files sync to your computer.

---

## How It Works

Create a file called `.frankdrive-ignore` in your sync folder (`~/FrankDrive-Sync/.frankdrive-ignore`).

Files matching patterns in this file **won't download** from the cloud.

---

## Example: Ignore Large Files

Create `~/FrankDrive-Sync/.frankdrive-ignore`:

```
# Ignore all videos
.mp4
.mov
.avi

# Ignore large screenshots
Screenshot

# Ignore specific file names
large-file.zip
presentation.pptx

# Comments start with #
# Blank lines are ignored
```

---

## Usage

### 1. Create the ignore file

```bash
nano ~/FrankDrive-Sync/.frankdrive-ignore
```

### 2. Add patterns (one per line)

```
.mp4
.mov
backup-
Screenshot
```

### 3. Restart the desktop app

Files matching these patterns will be skipped during sync.

---

## Pattern Matching

The app checks if the filename:
- **Contains** the pattern: `Screenshot` matches `Screenshot 2026-03-02.png`
- **Ends with** the pattern: `.mp4` matches `video.mp4`

**Examples:**

| Pattern | Matches | Doesn't Match |
|---------|---------|---------------|
| `.mp4` | `video.mp4`, `clip.mp4` | `video.mov` |
| `Screenshot` | `Screenshot 2026-03-02.png` | `Image.png` |
| `backup-` | `backup-2026.zip` | `file.zip` |
| `.png` | `image.png`, `photo.PNG` | `image.jpg` |

---

## Real-World Examples

### Save bandwidth - skip videos
```
.mp4
.mov
.avi
.mkv
```

### Skip large design files
```
.psd
.ai
.sketch
```

### Skip screenshots
```
Screenshot
Screen Recording
```

### Skip backups
```
backup-
.bak
.old
```

---

## Tips

✅ Patterns are **case-sensitive** (`.MP4` ≠ `.mp4`)  
✅ Use `#` for comments  
✅ One pattern per line  
✅ Restart the app after editing `.frankdrive-ignore`  

---

## Check What's Being Skipped

After restarting the app, check the logs:

**macOS:**
Look for lines like:
```
Skipping file (selective sync): large-video.mp4
```

---

## Temporarily Disable Selective Sync

Rename the file:
```bash
mv ~/FrankDrive-Sync/.frankdrive-ignore ~/FrankDrive-Sync/.frankdrive-ignore.disabled
```

Restart the app - all files will sync.

---

## Example: Skip Everything Except Documents

```
# Skip media
.mp4
.mov
.mp3
.jpg
.png

# Skip code
.js
.ts
.py
```

**Note:** This only affects **downloads**. Files you add to the sync folder still upload.
