# CollabForge Setup Checklist

Follow this step-by-step to get live at **collabforge.io**

---

## ☐ Part 1: Supabase Backend (15 min)

### Create Account
- [ ] Go to https://supabase.com
- [ ] Sign up with email or GitHub
- [ ] Create new project named "CollabForge"
- [ ] Save your database password somewhere safe

### Set Up Database
- [ ] In Supabase dashboard, go to SQL Editor
- [ ] Click "New Query"
- [ ] Copy/paste entire `database-schema.sql` file
- [ ] Click "Run" button
- [ ] Verify: Should see "4 tables created" message

### Set Up Storage
- [ ] Go to Storage section
- [ ] Click "New bucket"
- [ ] Name: `audio`
- [ ] Make it PUBLIC (check the box)
- [ ] Create bucket
- [ ] Click on `audio` bucket → Policies tab
- [ ] New policy for INSERT: authenticated users only
- [ ] New policy for SELECT: public (anyone can view)

### Get API Keys
- [ ] Go to Settings → API
- [ ] Copy "Project URL" (starts with https://...)
- [ ] Copy "anon public" key (long string starting with eyJ...)
- [ ] Keep these safe — you'll need them next

---

## ☐ Part 2: Configure Website (2 min)

### Update Config File
- [ ] Open `config.js` in a text editor
- [ ] Replace `YOUR_SUPABASE_URL` with your Project URL
- [ ] Replace `YOUR_SUPABASE_ANON_KEY` with your anon key
- [ ] Save file

---

## ☐ Part 3: Deploy to Vercel (10 min)

### Option A: GitHub (Recommended)
- [ ] Create GitHub account (if needed)
- [ ] Create new repository
- [ ] Upload all files from `collabforge-deploy` folder
- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub
- [ ] Click "Add New..." → "Project"
- [ ] Import your GitHub repo
- [ ] Click "Deploy"
- [ ] Wait 30 seconds — site is live!

### Option B: Direct Upload
- [ ] Go to https://vercel.com
- [ ] Sign up/sign in
- [ ] Click "Add New..." → "Project"
- [ ] Drag and drop the `collabforge-deploy` folder
- [ ] Click "Deploy"

---

## ☐ Part 4: Connect Your Domain (30-60 min)

### In Vercel
- [ ] Go to your project Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter: `collabforge.io`
- [ ] Vercel shows DNS records

### In Your Domain Registrar
(Where you bought collabforge.io — GoDaddy, Namecheap, etc.)

- [ ] Find DNS settings
- [ ] Add A record:
  - Type: `A`
  - Name: `@`
  - Value: `76.76.21.21`
- [ ] Add CNAME record:
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com`
- [ ] Save changes
- [ ] Wait 10-60 minutes for DNS to propagate

---

## ☐ Part 5: Test Everything (5 min)

### Once DNS is live
- [ ] Visit collabforge.io
- [ ] Click "Sign In" → Create account
- [ ] Upload a test song
- [ ] Open site in incognito/private window
- [ ] Create a second account (different email)
- [ ] Remix the first song
- [ ] Like a version
- [ ] Verify everything works!

---

## 🎉 You're Live!

Your site is now running at **https://collabforge.io**

Free tier limits:
- 500MB database
- 1GB file storage  
- 50,000 monthly users
- Unlimited bandwidth

This supports hundreds of users before you need to upgrade.

---

## ⚠️ Common Issues

**"Failed to fetch" errors**
→ Double-check config.js has correct Supabase URL and key

**Can't upload files**
→ Verify storage bucket is PUBLIC and policies are set

**Domain not working yet**
→ DNS changes take time (usually 10-60 min, max 48 hours)

**Getting 404 errors**
→ Make sure all files uploaded to Vercel (index.html, config.js, app.js)

---

## 📞 Need Help?

Check `DEPLOYMENT-GUIDE.md` for detailed troubleshooting.

---

**Total time: ~30-60 minutes**  
**Total cost: $0/month**

Now go build your community. 🎵
