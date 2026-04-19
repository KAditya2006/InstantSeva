# InstantSeva | Hyperlocal Service Marketplace

InstantSeva is a high-performance, secure, and user-centric platform designed to connect local service professionals (Plumbers, Electricians, Tutors, etc.) with customers in their immediate vicinity.

---

## 🛠 Tech Stack & Architecture

### Frontend (Client-Side)
- **Framework**: [React.js v19](https://react.dev/) using Functional Components and Hooks.
- **Build Tool**: [Vite](https://vitejs.dev/) for extremely fast development and optimized production builds.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom configuration for premium aesthetics (Glassmorphism, gradients).
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth layout transitions and interactive UI elements.
- **Icons**: [Lucide React](https://lucide.dev/) for a clean, consistent icon set.
- **Mapping**: [Leaflet](https://leafletjs.com/) and [React-Leaflet](https://react-leaflet.js.org/) for real-time location visualization and point-of-interest markers.
- **State Management**: [React Context API](https://react.dev/learn/passing-data-deeply-with-context) for global Authentication and User state.
- **API Handling**: [Axios](https://axios-http.com/) with request/response interceptors for automatic JWT token management.
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/) and [Web-Push](https://www.npmjs.com/package/web-push) for high-quality, non-blocking user feedback and browser alerts.

### Backend (Server-Side)
- **Runtime**: [Node.js](https://nodejs.org/) (LTS).
- **Framework**: [Express.js](https://expressjs.com/) for a robust RESTful API.
- **Database**: [MongoDB](https://www.mongodb.com/) (NoSQL) for flexible schema design and high scalability.
- **ODM**: [Mongoose](https://mongoosejs.com/) for schema validation and data relationship management.
- **Communication**: [Socket.io](https://socket.io/) for real-time messaging, status updates, and live location tracking.
- **Image Handling**: [Multer](https://github.com/expressjs/multer) and [Cloudinary SDK](https://cloudinary.com/) for secure cloud-based media storage.
- **Communication Services**: [Nodemailer](https://nodemailer.com/) for transactional emails and [VAPID](https://blog.mozilla.org/services-engineering/2016/07/04/vapid-is-ready-to-roll/) for secure push notifications.

---

## 🔐 Advanced Security & Verification

InstantSeva prioritizes trust. The following three-tier verification system is implemented:

1. **Identity Integrity (OTP)**: Every user account must be verified via a 6-digit email OTP. This prevents "botting" and ensures every user (customer or worker) has a valid reachable email.
2. **Worker KYC Gatekeeper**: Unlike other platforms where anyone can start working instantly, InstantSeva requires workers to upload ID Proof and Certificates. An **Admin** must manually review and approve the worker through the Audit dashboard before their profile becomes searchable.
3. **The "Service Handshake" (Start/End OTP)**: To prevent fraudulent job completions:
   - When a worker arrives, they must ask the customer for a **Start OTP**. The app won't let the job begin without it.
   - When the job is finished, the worker must enter an **End OTP** from the customer to close the booking and trigger the review system.
4. **Traffic Security & Accountability**: Implementation of **Rate Limiters** on critical endpoints (Auth, Chat, OTP), CSRF protection, and a comprehensive **Audit Log** system to track administrative actions and critical platform events.

---

## 🚀 Intelligent Engine Features

Beyond discovery, InstantSeva powers business with advanced logic:

### 📍 Geolocation Search & Sorting
- **Distance-Based Discovery**: Automatically sorts workers based on their physical proximity to the customer using the **Haversine Formula**.
- **Live Worker Presence**: Real-time indicators showing if a professional is currently `Online`, `Available`, `Busy`, or `Offline`.
- **Fuzzy Skill Matching**: Search logic that handles service aliases (e.g., "pharmacist" vs "chemist") and fuzzy matching for skill keywords.

### 💬 Real-time Communication
- **Integrated Chat**: Seamless messaging with support for text and **Image Messages** (via Cloudinary) directly inside the app.
- **Status Sync**: Automatic "Read" receipts and notification triggers for new messages.
- **Push Alerts**: Browser-level push notifications to ensure users never miss an update, even when the tab is closed.

### 🗺 Tracking & Execution
- **Arrival Tracking**: A dynamic map interface showing the worker's approach to the service location after a job is accepted.
- **Dynamic Pricing**: Support for flexible pricing models (Per Hour, Per Job, Per Day) defined by the worker.

---

## 📈 Search Engine Optimization (SEO)

To ensure the marketplace is visible on Google, the project implements:
- **Dynamic Sitemap**: A dynamically updated `sitemap.xml` that auto-indexes every new approved worker and service category.
- **Meta-Data Mastery**: The `index.html` is packed with **Open Graph (OG)** and **Twitter Card** meta tags for premium link previews on social media.
- **Schema.org Structured Data**: JSON-LD scripts are injected to help Google understand the organization, logo, and website structure.
- **Robots Management**: A custom `robots.txt` ensures search crawlers focus on valuable public content while ignoring private account pages.

---

## 🔄 User Workflow

### 👤 Customer (User) Workflow
1. **Discover**: Browse categories and find experts via distance-sorted search results.
2. **Chat**: Communicate with professionals to discuss job details and share images of the problem.
3. **Book**: Send a booking request with a custom message and schedule.
4. **Track**: Monitor the worker's arrival in real-time on the tracking map.
5. **Complete**: Provide secure OTPs to start and finish the job, then leave a verified review.

### 🛠 Worker (Service Pro) Workflow
1. **Onboard**: Submit KYC documents and set custom pricing/skills.
2. **Manage**: Toggle availability status and monitor earnings/job performance in the dashboard.
3. **Execute**: Receive push alerts for new jobs, chat with customers, and use the tracking map to reach the destination.

---

## 📁 Project Structure

```text
root/
├── backend/            # Business Logic & API Layer
│   ├── config/         # Server configuration (DB, Cloudinary, Env)
│   ├── controllers/    # API Request handlers (Auth, Booking, Admin)
│   ├── models/         # MongoDB Schemas (User, Worker, Booking, Review)
│   ├── routes/         # API Endpoint definitions
│   ├── services/       # Core services (OTP, Location, Push Notifications)
│   ├── utils/          # Middleware & Background utilities
│   └── app.js          # Main Express application setup
├── frontend/           # Presentation & Interaction Layer
│   ├── public/         # Static assets, Favicons, SEO files
│   └── src/
│       ├── components/ # Reusable UI components (Navbar, Map, Loaders)
│       ├── context/    # Global State (Auth, Notifications)
│       ├── pages/      # Route-level components (Home, Search, Dashboard)
│       ├── services/   # Frontend API client (Axios)
│       └── utils/      # Client-side helpers (Date formatters, INR Currency)
└── PROJECT_OVERVIEW.md # Comprehensive Technical Documentation
```

---

## 🗺 Future Roadmap
- [ ] **Payment Gateway**: Integration of Razorpay/Stripe for automatic payments.
- [ ] **Native Mobile App**: Porting the experience to React Native for localized performance.
- [ ] **Worker Subscriptions**: Premium tiers for workers to get "Pinned" at the top of search.
- [ ] **AI-Powered Matching**: Recommendation engine to suggest the best worker based on behavior.
