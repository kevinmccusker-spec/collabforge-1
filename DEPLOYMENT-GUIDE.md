# CollabForge Deployment Guide

Get CollabForge live at **collabforge.io** in under 1 hour.

---

## Step 1: Set Up Supabase (Backend)

### 1.1 Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new project:
   - **Name:** CollabForge
   - **Database Password:** (Create a strong password - save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier (perfect for getting started)

### 1.2 Set Up Database Tables

Once your project is created:

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste the SQL from `database-schema.sql` (included in this folder)
4. Click **Run** (or press Ctrl/Cmd + Enter)

This creates all the tables you need:
- `profiles` (user accounts with usernames)
- `songs` (original uploads)
- `versions` (remixes and originals)
- `version_likes` (like tracking)

### 1.3 Set Up Storage Bucket

1. Go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Name it: `audio`
4. Make it **Public** (check the box)
5. Click **Create bucket**

Now set storage policies:
1. Click on the `audio` bucket
2. Go to **Policies** tab
3. Click **"New Policy"**
4. For INSERT: Enable for authenticated users
5. For SELECT: Enable for public (so anyone can listen)

### 1.4 Get Your API Keys

1. Go to **Settings** (left sidebar) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Step 2: Configure the Website

### 2.1 Update config.js

Open `config.js` and replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',  // Your Project URL
    anonKey: 'eyJxxxxxxxxxxxxx'  // Your anon public key
};
```

---

## Step 3: Deploy to Vercel (Hosting)

### 3.1 Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Use your GitHub account (easiest)

### 3.2 Deploy Your Site

**Option A: Using GitHub (Recommended)**

1. Create a new GitHub repository
2. Upload these files to your repo:
   - `index.html`
   - `config.js` (with your Supabase keys filled in)
   - `app.js`
3. In Vercel, click **"Add New..."** → **"Project"**
4. Import your GitHub repository
5. Click **Deploy** (no configuration needed!)
6. Wait 30 seconds - your site is live!

**Option B: Drag and Drop**

1. In Vercel, click **"Add New..."** → **"Project"**
2. Click **"Browse"** and select this folder
3. Click **Deploy**

### 3.3 Connect Your Domain (collabforge.io)

1. In your Vercel project, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `collabforge.io`
4. Vercel will show you DNS records to add

Now go to your domain registrar (where you bought collabforge.io):

5. Add an **A record**:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel's IP)
6. Add a **CNAME record**:
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

Wait 5-60 minutes for DNS to propagate. Then **collabforge.io** will be live!

---

## Step 4: Test Everything

1. Visit your site at `collabforge.io`
2. Create an account
3. Upload a test song
4. Create a second account (use a different email)
5. Remix the first song
6. Like a version
7. Verify everything works!

---

## What You Get (Free Tier Limits)

**Supabase Free:**
- 500MB database storage
- 1GB file storage (plenty for audio)
- 50,000 monthly active users
- Unlimited API requests

**Vercel Free:**
- 100GB bandwidth/month
- Unlimited websites
- Automatic SSL (HTTPS)
- Global CDN

This is enough for hundreds of users before you need to upgrade.

---

## Troubleshooting

### "Failed to fetch" errors
- Check that config.js has the correct Supabase URL and key
- Make sure the `audio` bucket is public

### Can't upload files
- Verify storage policies allow authenticated users to INSERT
- Check file size (free tier = 50MB max per file)

### Domain not working
- DNS changes take time (up to 48 hours, usually 10 minutes)
- Verify A and CNAME records are correct

---

## Next Steps After Launch

Once you have real users:

1. **Set up email notifications** (Supabase has built-in email)
2. **Add social auth** (Google, GitHub sign-in)
3. **Implement royalty tracking** (when songs go commercial)
4. **Add Spotify/Apple Music integration**
5. **Build mobile apps** (React Native)

---

## Support

If you get stuck:
- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
- Or reach out for help!

---

## Cost Estimates

**Month 1-3 (0-500 users):** $0/month (free tier)
**Growing (500-10k users):** ~$25/month (Supabase Pro)
**Scaling (10k+ users):** ~$100-500/month (depends on usage)

You won't pay anything until you have real traction. Start free, scale as needed.
