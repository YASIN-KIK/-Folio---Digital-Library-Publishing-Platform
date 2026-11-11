# Folio - Collaborative Digital Library & Publishing Platform

A collaborative digital library and book publishing platform featuring 115+ multi-chapter books, in-book narrative illustrations, distraction-free reading modes, reading clubs, and administrative governance.

## 🚀 Quick Deploy to Render (Web Service)

### Option 1: Native Python & Node Build
1. Create a **New Web Service** on [Render](https://render.com).
2. Connect your GitHub repository containing these files.
3. Set the following settings:
   - **Environment:** `Python 3`
   - **Build Command:**
     ```bash
     npm install && npm run build && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
4. Click **Create Web Service**. Your app will be live at `https://<your-service>.onrender.com` accessible to everyone worldwide with no login required!

### Option 2: Run Locally
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Install frontend dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Start the server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8080
   ```
4. Open `http://localhost:8080`.

## 👑 Admin Credentials
- **Email:** `yasinkik@outlook.com`
- **Password:** `YASINKIK01`
- **Name:** Yasin Kik (👑 System Administrator & Author)
