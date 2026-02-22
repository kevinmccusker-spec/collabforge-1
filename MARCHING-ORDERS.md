# CollabForge v2 — Marching Orders

This is the proper Next.js rebuild. Your Supabase backend is already set up — this just replaces the old frontend.

---

## What Changed from v1

- ✅ Proper Next.js app (not vanilla HTML)
- ✅ "Cover" vs "Alter" tagging on remixes
- ✅ 10MB file size limit enforced
- ✅ Dashboard page (your songs, your remixes, stats)
- ✅ Search by title/mood
- ✅ Cleaner auth flow (no double Supabase init bug)
- ✅ Environment variables (safer than hardcoded keys)

---

## Step 1: Update Supabase Database (2 min)

1. Go to **supabase.com** → your project → **SQL Editor**
2. Click **New Query**
3. Copy/paste everything from **database-update.sql**
4. Click **Run**

This adds the "cover vs alter" column to your versions table.

---

## Step 2: Upload to GitHub (5 min)

1. Go to **github.com/kevinmccusker-spec/collabforge-1**
2. You need to upload ALL files from this folder
3. **Delete the old files first** (config.js, app.js, index.html)
4. Upload ALL these new files:
   - `package.json`
   - `next.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `pages/_app.js`
   - `pages/index.js`
   - `pages/dashboard.js`
   - `components/Header.js`
   - `components/AuthModal.js`
   - `components/UploadModal.js`
   - `components/SongCard.js`
   - `lib/supabase.js`
   - `styles/globals.css`

---

## Step 3: Add Environment Variables to Vercel (3 min)

This is IMPORTANT — your API keys need to be in Vercel, not in code files.

1. Go to **vercel.com** → your collabforge-1 project
2. Click **Settings** → **Environment Variables**
3. Add these two variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jegndqysipcssteoosdx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ25kcXlzaXBjc3N0ZW9vc2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTMyNzIsImV4cCI6MjA4NjY2OTI3Mn0.CqXAA_IiTt2X7PHqYn6a1LJXWlyXMnMbl8jrPfNMijE` |

4. Make sure both are set for **Production**, **Preview**, and **Development**
5. Click **Save**

---

## Step 4: Redeploy Vercel (2 min)

1. In Vercel → your project → **Deployments** tab
2. Click the **"..."** next to your latest deployment
3. Click **"Redeploy"**
4. Wait 60 seconds

OR — just push a change to GitHub and Vercel will auto-redeploy.

---

## Step 5: Disable Email Confirmation in Supabase (IMPORTANT!)

This is probably why sign-in was stalling before.

1. Go to **supabase.com** → your project
2. Click **Authentication** (left sidebar)
3. Click **Providers**
4. Click **Email**
5. Toggle OFF **"Confirm email"**
6. Save

Now users can sign up and sign in immediately without confirming email.

---

## Step 6: Test Everything (5 min)

1. Visit **collabforge.io**
2. Click "Sign In" → modal should open ✓
3. Create an account ✓
4. Upload a test song → "letting go" confirmation appears ✓
5. Sign in as different user → add a remix (cover or alter) ✓
6. Like a version ✓
7. Check Dashboard page ✓

---

## If Something Breaks

**"Module not found" errors** → Check all files are uploaded to GitHub in the right folders (pages/, components/, lib/, styles/)

**"Failed to fetch" errors** → Check environment variables are set in Vercel

**Sign in stalling** → Make sure email confirmation is disabled in Supabase (Step 5 above)

**Build fails on Vercel** → Check the build logs in Vercel → Deployments tab for specific errors

---

## For Your Web Developer

Hand them this folder. They'll understand it immediately:
- Standard Next.js 14 app
- Supabase for everything (auth, db, storage)
- Already deployed to Vercel at collabforge.io
- Backend is 100% set up — just need to get the frontend working
- Main issue to fix: auth flow stalling on sign-in
- Next features: audio player UI, email notifications, royalty tracking

---

**You're so close. The foundation is solid.**
