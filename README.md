# 🚗 RCVE - Roadside Compliance Verification Engine

A smart, AI-powered system for verifying vehicle documents and driving licenses. It helps **Citizens** manage their documents and **Police** verify them instantly using AI and QR codes.

## 🌟 Features

### 👤 Citizen Portal
*   **Upload & Analyze:** Upload photos of your **Driving License (DL)**, **Registration Certificate (RC)**, **Insurance**, and **PUC**.
*   **AI Extraction:** The system automatically reads details (Name, Reg No, Expiry Date) from the image.
*   **Digital Wallet:** Save your verified documents as digital cards.
*   **Generate Token:** Get a unique **QR Token** for each document to show to the police.

### 👮 Police Portal
*   **Instant Verification:** Scan a citizen's token to see their document details.
*   **AI Validation:** The system checks if the document is **Valid**, **Expired**, or **Suspicious**.
*   **Visual Check:** View the original uploaded image to compare with the physical document.

### 🛡️ Admin Portal
*   **User Management:** View all registered users and their stats.
*   **System Oversight:** Check uploaded documents and vehicles.
*   **Control:** Remove users or flagged content.

---

## 🏗️ Architecture (Simplified)

Think of RCVE as a smart digital filing cabinet with a built-in expert.

1.  **The Input (Upload):**
    *   A user takes a photo of their document (like a Driving License) and uploads it to the app.
    
2.  **The Brain (AI Analysis):**
    *   The app sends this photo to **Google Gemini** (a powerful AI).
    *   Gemini looks at the photo and says: *"This is a Driving License. The number is DL-12345. It expires on 2030-01-01."*
    *   It also checks for issues: *"wait, this image looks blurry"* or *"this document is expired!"*

3.  **The Storage (Database):**
    *   The app saves these details and the photo safely in a database (like a secure digital locker).
    *   It gives the document a unique **Secret Code (Token)**.

4.  **The Verification (Police Check):**
    *   When a Police officer enters the **Secret Code**, the app fetches the details from the locker.
    *   The officer sees:
        *   ✅ **Status:** Valid / Expired
        *   📄 **Details:** Name, Vehicle Model, etc.
        *   🖼️ **Proof:** The original photo uploaded by the user.

### 🛠️ Tech Stack
*   **Frontend:** Next.js (React), Tailwind CSS, ShadCN UI
*   **Backend:** Next.js API Routes
*   **Database:** SQLite (with Prisma ORM)
*   **AI Model:** Google Gemini Flash
*   **Auth:** NextAuth.js

---

## 🚀 Getting Started

### Prerequisites
*   Node.js installed
*   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/gourijnair/RCVS.git
    cd rcve-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add:
    ```env
    DATABASE_URL="file:./dev.db"
    NEXTAUTH_SECRET="your-secret-key"
    GEMINI_API_KEY="your-gemini-api-key"
    ```

4.  **Initialize Database:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run the App:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Credentials
*   **Admin Login:** `admin@2003` / `admin@2003`
*   **Police Login:** Create any account with the "Police" role (or use signup flow if enabled).
*   **Citizen Login:** Sign up as a new user.

---
**Built for the Future of Traffic Compliance.** 🚦
