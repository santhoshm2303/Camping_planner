# 🏕️ Lake Leschenaultia Camp Planner

A real-time collaborative camping planner for SaMeg, PraKrithi & NagKav.
Powered by React + Firebase Firestore. Deploy to Vercel for a shareable URL.

---

## 🚀 Deploy in 5 steps

### Step 1 — Install Node.js
Download from https://nodejs.org (click "LTS" version) and install it.

### Step 2 — Upload this folder to GitHub
1. Go to https://github.com and sign in (or create a free account)
2. Click **"New repository"** → name it `camping-planner` → click **Create**
3. On the next screen click **"uploading an existing file"**
4. Drag the entire `camping-deploy` folder contents in and click **Commit**

### Step 3 — Deploy to Vercel
1. Go to https://vercel.com and sign in with your GitHub account
2. Click **"Add New Project"**
3. Find and select your `camping-planner` repo → click **Import**
4. Leave all settings as default → click **Deploy**
5. Wait ~1 minute — Vercel builds and gives you a URL like:
   `https://camping-planner-abc123.vercel.app`

### Step 4 — Share the URL
Send that URL to SaMeg, PraKrithi and NagKav.
Everyone opens it, taps their name at the top, and all changes sync live instantly.

### Step 5 — Firebase rules (if you see permission errors)
1. Go to https://console.firebase.google.com
2. Open your `camping-planner-bdf2d` project
3. Go to **Firestore Database → Rules**
4. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

---

## 📁 File structure

```
camping-deploy/
├── public/
│   └── index.html
├── src/
│   ├── index.js        ← entry point
│   ├── App.js          ← full app UI + Firebase ops
│   └── firebase.js     ← Firebase config + seed data
└── package.json
```

---

## 🔥 How real-time sync works

- All data (gear, meals, groceries, activities) lives in **Firebase Firestore**
- Every change (add, edit, delete, vote, pack) is written to Firestore instantly
- All three users see updates **live without refreshing**
- The pulsing 🟢 **Live** dot in the header confirms the connection is active
