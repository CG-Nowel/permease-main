# PERMEASE – RFID-Based Student Test Permit Management System

> **Automated, secure, and streamlined touchless student examination permit management and verification system.**

---

## 📖 Quick Links
- **[Full Technical Specification](file:///c:/xampp/htdocs/permease/PROJECT_SPECIFICATION.md)**: Detailed database schemas, business rules, API specifications, and architectural diagrams.
- **[Frontend Application](file:///c:/xampp/htdocs/permease/frontend)**: React 19 + TypeScript Vite SPA.
- **[Backend API](file:///c:/xampp/htdocs/permease)**: Laravel 11.x RESTful API & hardware integration service.

---

## 🏛️ System Overview

**PERMEASE** is an enterprise-grade academic information system engineered for schools, colleges, and universities. It integrates contactless RFID smart cards with automated touchscreen kiosks and administrative clearance workflows to replace manual test permit distribution.

### 🌟 Key Highlights
- **Registrar Management**: Fast student enrollment with animated touchless RFID pairing and card lifecycle management.
- **Accounting Clearance**: Granular financial clearance tracking (`CLEARED` vs `WITH_BALANCE`) and one-time permit reprint fee processing.
- **Touchscreen Student Kiosk (`/kiosk`)**: Contactless self-service kiosk with animated radar scanning, instant eligibility checks, and automatic test permit printing.
- **Single-Print & Reprint Business Rule**: 1 initial permit per student per exam cycle; reprints require accounting authorization and are consumed atomically.
- **Institutional Design Tokens**: Styled with Deep Navy Blue (`#0B1B3D`), Royal Blue (`#1E40AF`), and Metallic Gold (`#D4AF37`) accents.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend & REST API** | Laravel 11.x, PHP 8.2+, Laravel Sanctum |
| **Frontend Client** | React 19, TypeScript, Vite |
| **UI & Styling** | Tailwind CSS v4, Lucide React, Framer Motion |
| **Forms & State** | TanStack Query v5, React Hook Form, Zod |
| **Feedback & UX** | Sonner, SweetAlert2, Recharts, Custom Skeleton Loaders |
| **Document Printing** | React-to-Print / jsPDF (Print-only layout) |
| **Database** | MySQL 8.0+ (InnoDB, Foreign Key Integrity, ACID Transactions) |
| **Hardware** | USB / Serial / ESP32 RFID Readers (13.56 MHz / 125 kHz) |

---

## 🚀 Getting Started

### 1. Backend (Laravel)
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

For the complete project blueprint, database migration definitions, and system workflows, refer to **[PROJECT_SPECIFICATION.md](file:///c:/xampp/htdocs/permease/PROJECT_SPECIFICATION.md)**.
