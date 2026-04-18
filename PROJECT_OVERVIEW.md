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
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/) for high-quality, non-blocking user feedback.

### Backend (Server-Side)
- **Runtime**: [Node.js](https://nodejs.org/) (LTS).
- **Framework**: [Express.js](https://expressjs.com/) for a robust RESTful API.
- **Database**: [MongoDB](https://www.mongodb.com/) (NoSQL) for flexible schema design and high scalability.
- **ODM**: [Mongoose](https://mongoosejs.com/) for schema validation and data relationship management.
- **Communication**: [Socket.io](https://socket.io/) (WIP Integration) for real-time messaging and status updates.
- **Image Handling**: [Multer](https://github.com/expressjs/multer) and [Cloudinary SDK](https://cloudinary.com/) for secure cloud-based media storage.
- **Communication Services**: [Nodemailer](https://nodemailer.com/) for transactional emails (OTP, password resets).

---

## 🔐 Advanced Security & Verification

InstantSeva prioritizes trust. The following three-tier verification system is implemented:

1. **Identity Integrity (OTP)**: Every user account must be verified via a 6-digit email OTP. This prevents "botting" and ensures every user (customer or worker) has a valid reachable email.
2. **Worker KYC Gatekeeper**: Unlike other platforms where anyone can start working instantly, InstantSeva requires workers to upload ID Proof and Certificates. An **Admin** must manually review and approve the worker through the Audit dashboard before their profile becomes searchable.
3. **The "Service Handshake" (Start/End OTP)**: To prevent fraudulent job completions:
   - When a worker arrives, they must ask the customer for a **Start OTP**. The app won't let the job begin without it.
   - When the job is finished, the worker must enter an **End OTP** from the customer to close the booking and trigger the review system.

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
1. **Discover**: Browse professional categories from the high-fidelity landing page.
2. **Search**: Find experts near you using Leaflet-powered geolocation filters.
3. **Review**: Check professional bios, expertise, and verified customer ratings.
4. **Onboard**: Register via OTP-verified signup.
5. **Book**: Send a booking request with a custom message and schedule.
6. **Track**: Monitor the lifecycle of your service in a dedicated dashboard.
7. **Complete**: Provide the worker with secure OTPs to start and finish the job.

### 🛠 Worker (Service Pro) Workflow
1. **Register**: Sign up as a specialized service provider.
2. **Onboard**: Submit KYC documents (ID proof/Certificates).
3. **Wait**: After admin approval, the profile becomes visible in the marketplace.
4. **Manage**: Toggle availability (Available/Busy/Offline) to control your workload.
5. **Execute**: Receive requests, chat with customers, and execute the service using the OTP handshake.

---

## 📁 Project Structure

```text
root/
├── backend/            # Business Logic & API Layer
│   ├── config/         # Server configuration (DB, Cloudinary, Env)
│   ├── controllers/    # API Request handlers (Auth, Booking, Admin)
│   ├── models/         # MongoDB Schemas (User, Worker, Booking, Review)
│   ├── routes/         # API Endpoint definitions
│   ├── services/       # Core services (OTP, Location, Notifications)
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
- [ ] **Native Location Tracking**: Real-time worker tracking using a mobile app.
- [ ] **Worker Subscriptions**: Premium tiers for workers to get "Pinned" at the top of search.
- [ ] **AI-Powered Matching**: Recommendation engine to suggest the best worker based on behavior.
