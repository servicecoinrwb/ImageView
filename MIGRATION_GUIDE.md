# Firebase Migration Guide

## Files in this package

| File | Purpose |
|------|---------|
| `client/src/lib/firebase.ts` | Firebase app initialization |
| `client/src/lib/firestoreService.ts` | Replaces PostgreSQL / DatabaseStorage |
| `client/src/lib/storageService.ts` | Replaces Replit ObjectStorageService + Sharp |
| `client/src/lib/utils.ts` | Browser UUID utility |
| `firebase.json` | Firebase Hosting config |
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Firebase Storage security rules |
| `.github/workflows/deploy.yml` | Auto-deploy on push to main |

---

## Step 1 — Install Firebase SDK

In your project root run:
```
npm install firebase
npm install -D firebase-tools
```

Remove old backend packages (no longer needed):
```
npm uninstall drizzle-orm drizzle-kit @google-cloud/storage sharp multer pg
```

---

## Step 2 — Get your Firebase config

1. Go to https://console.firebase.google.com
2. Select your project
3. Click the gear icon → **Project Settings**
4. Scroll to **Your Apps** → click your web app (or create one)
5. Copy the firebaseConfig values

---

## Step 3 — Update firebase.ts

Fill in your real values in `client/src/lib/firebase.ts`:
```ts
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...",
};
```

**For production**, use environment variables instead:
```ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

---

## Step 4 — Update your frontend API calls

Replace all old API calls with the new Firebase services:

### Fetching images
```ts
// OLD
const res = await fetch("/api/images");
const images = await res.json();

// NEW
import { getAllImages } from "@/lib/firestoreService";
const images = await getAllImages();
```

### Uploading images
```ts
// OLD
const formData = new FormData();
formData.append("image", file);
const res = await fetch("/api/images/upload-compressed", {
  method: "POST", body: formData
});

// NEW
import { uploadImage } from "@/lib/storageService";
const result = await uploadImage(file);
```

### Deleting images
```ts
// OLD
await fetch(`/api/images/${id}`, { method: "DELETE" });

// NEW
import { deleteImage } from "@/lib/storageService";
await deleteImage(id, image.objectPath);
```

### Getting image URL
```ts
// OLD — image.objectPath was a relative path like /objects/uuid
// and needed to be fetched from your server

// NEW — image.objectPath IS the full Firebase Storage URL, use directly:
<img src={image.objectPath} />
```

---

## Step 5 — Upload Firebase config files

Copy these to your repo root:
- `firebase.json`
- `firestore.rules`
- `storage.rules`

---

## Step 6 — Add GitHub Secrets for CI/CD

Go to your GitHub repo → **Settings → Secrets → Actions** and add:

| Secret | Value |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | Your API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `VITE_FIREBASE_APP_ID` | Your app ID |
| `FIREBASE_SERVICE_ACCOUNT` | See below |

### Getting FIREBASE_SERVICE_ACCOUNT
1. Firebase Console → Project Settings → **Service Accounts**
2. Click **Generate new private key**
3. Copy the entire JSON content as the secret value

---

## Step 7 — Enable Firebase Storage

1. Firebase Console → **Storage**
2. Click **Get started**
3. Choose a region (us-central1 recommended)
4. Start in **production mode**
5. Upload `storage.rules` via the Rules tab

---

## Step 8 — Deploy Firestore rules

1. Firebase Console → **Firestore**
2. Click **Rules** tab
3. Paste the contents of `firestore.rules`
4. Click **Publish**

---

## Step 9 — Delete the server folder

Once migrated, you can delete:
- `server/` folder entirely
- `shared/` folder (schema no longer needed)
- `drizzle.config.ts`
- `migrations/` folder

Your app is now 100% frontend with Firebase backend — no server needed!

---

## Cost (Free Tier)
- Firebase Hosting: 10GB/month free
- Firestore: 50K reads, 20K writes/day free
- Firebase Storage: 5GB storage, 1GB/day download free
- Total: **$0/month** for a typical image hosting site
