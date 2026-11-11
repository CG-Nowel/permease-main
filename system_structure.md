# PERMEASE – System Architecture & Directory Structure Guide

This document provides a comprehensive technical blueprint of the PERMEASE RFID Student Test Permit Management System, detailing its enterprise-grade directory structure, design patterns, separation of concerns, and scalability guidelines.

---

## 🏛️ High-Level Directory Overview

```text
permease/
├── app/                        # Laravel Backend: Controllers, Models, Services, Policies
├── bootstrap/                  # Laravel framework bootstrap and providers
├── config/                     # Application and service configurations
├── database/                   # Migrations, seeders, factories
├── public/                     # Public web root (compiled assets in build/, index.php)
├── resources/                  # Laravel views (app.blade.php host layout, emails)
│   ├── css/
│   ├── js/
│   └── views/
├── routes/                     # API & Web routes (api.php, web.php)
├── src/                        # Modern React SPA Client Application
│   ├── app/                    # Application Core (Root App, Providers, Routes)
│   ├── components/             # Reusable Presentation Components
│   │   ├── feedback/           # Modals, Toast wrappers, Radar animations
│   │   ├── permits/            # Examination permit printable layout
│   │   └── ui/                 # Atomic UI primitives (Button, Card, Input, Badge, Skeleton)
│   ├── layouts/                # Structural layout shells (AdminLayout, KioskLayout, Sidebar)
│   ├── lib/                    # Shared libraries, Axios client, utils, constants
│   ├── mock/                   # Static mock fixtures and demo datasets
│   ├── pages/                  # Route views categorized by domain
│   │   ├── accounting/         # All Accounting pages (Balances, Reprints, History, Modals)
│   │   ├── auth/               # Staff authentication
│   │   ├── dashboard/          # Analytics and student roster overview
│   │   ├── kiosk/              # All Kiosk pages (Touchscreen scanner, Permit print)
│   │   └── registrar/          # All Registrar pages (Registration, Directory, RFID tags)
│   ├── store/                  # Global application state and contexts (Auth, RFID)
│   ├── styles/                 # Global styles and theme tokens (theme.css, globals.css)
│   ├── types/                  # TypeScript domain models and contract types
│   ├── main.tsx                # Client DOM mount entry point
│   └── vite-env.d.ts           # Vite client environment types
├── storage/                    # Laravel logs, cache, framework sessions
├── tests/                      # Feature and unit test suites
├── index.html                  # Vite root template for standalone client dev
├── package.json                # Frontend dependencies and build scripts
├── tsconfig.json               # TypeScript path alias (@/*) and compiler config
├── vite.config.js              # Vite bundler configuration
├── system_structure.md         # This technical specification
└── PROJECT_SPECIFICATION.md    # Master functional specification and business rules
```

---

## 📂 Detailed `src/` Directory Breakdown

### 1. `src/app/` — Application Foundation
The `app/` folder serves as the central orchestrator for the React application:
- **`App.tsx`**: Top-level root component wrapping routes with providers.
- **`providers.tsx`**: Encapsulates external contexts (`QueryClientProvider`, `AuthProvider`, `Toaster`).
- **`router.tsx`**: Declarative route registry utilizing React Router 7. Cleanly isolates route path bindings from presentation logic.

### 2. `src/components/` — Modular Component Hierarchy
Components adhere to atomic design and strict reusability:
- **`ui/`**: Base UI elements designed with Tailwind CSS and brand tokens.
  - `Button.tsx`: Supports variants (`gold`, `primary`, `danger`, `outline`, `kiosk`).
  - `Card.tsx`: Standardized card containers featuring `12–18px` radii and soft ambient shadows.
  - `Input.tsx`: Floating labels, left icon slots, and active metallic gold focus rings.
  - `Badge.tsx`: Visual status indicators (`CLEARED`, `WITH_BALANCE`, `PRINTED`, `AVAILABLE`).
  - `Skeleton.tsx`: Context-aware skeleton loaders eliminating disruptive "Loading..." plain text.
- **`feedback/`**:
  - `RfidScannerRadar.tsx`: Concentric pulsing radar waves emulating contactless RFID smart card detection.
- **`permits/`**:
  - `TestPermitDocument.tsx`: Isolated examination permit template with exam schedule matrix, proctor signature lines, and QR verification digest.

### 3. `src/layouts/` — Frame & Screen Shells
- **`AdminLayout.tsx`**: Houses the collapsible administrative sidebar and content viewport for Registrar and Accounting staff.
- **`KioskLayout.tsx`**: A distraction-free, fullscreen layout optimized for touchscreen self-service terminals. Disables admin navigation and exposes high-contrast cues.
- **`Sidebar.tsx`**: Institutional sidebar featuring Deep Navy (`#0B1B3D`) and Metallic Gold (`#D4AF37`) active states.

### 4. `src/lib/` — Utilities & API Infrastructure
- **`api.ts`**: Configured Axios instance with request/response interceptors, automatic Bearer token injection, and 401 redirect handling.
- **`constants.ts`**: Central registry of route URLs, API endpoints, and institutional brand color tokens.
- **`utils.ts`**: Generic formatting functions (`formatDate`, `formatCurrency`, `formatStudentName`, `cn` class merger).

### 5. `src/mock/` — Decoupled Test Fixtures
Keeps page components concise and readable by isolating mock test data:
- **`mockStudents.ts`**: Seed student profiles with varied academic, RFID, and financial standing.
- **`mockPayments.ts`**: Mock receipt records for authorized test permit reprint transactions.

### 6. `src/pages/` — Domain-Driven Views
Pages are organized by administrative department and feature responsibilities:
- **`auth/`**: `LoginPage.tsx` (Supports role switching between Registrar and Accounting).
- **`dashboard/`**: `DashboardPage.tsx` (Key KPI metrics, recent activity stream, searchable student directory).
- **`registrar/`**: `RegisterStudentPage.tsx` (Multi-section enrollment form with animated "REGISTER & ASSIGN RFID" modal).
- **`accounting/`**:
  - `BalanceManagementPage.tsx` (Toggle clearance status with live audit trail history).
  - `ReprintPaymentsPage.tsx` (Collect reprint fees and authorize single-use kiosk permits).
- **`kiosk/`**: `KioskPage.tsx` (Full state machine: Idle Tap -> Unrecognized -> Eligible -> With Balance -> Reprint Required -> Approved -> Dispensed).
- **`permit/`**: `TestPermitPrintView.tsx` (Printable canvas utilizing `@media print` rules).

### 7. `src/store/` — State Management & Contexts
- **`AuthContext.tsx` / `authStore.ts`**: Manages session credentials, authenticated user profiles, permissions, and persistent `localStorage` synchronization.

### 8. `src/styles/` — Design Tokens & Resets
- **`theme.css`**: Defines CSS custom properties for Deep Navy Blue (`#0B1B3D`), Royal Blue (`#1E40AF`), Metallic Gold (`#D4AF37`), and Champagne Gold (`#F3E5AB`).
- **`globals.css`**: Global typography defaults, smooth transitions, and print media optimizations.

### 9. `src/types/` — Type Safety & Domain Contracts
- **`index.ts`**: TypeScript definitions for `User`, `Student`, `RfidCard`, `FinancialStatusRecord`, `TestPermit`, `ReprintPayment`, and `ActivityLog`.

---

## 🚀 Key Scalability Advantages

1. **Separation of Concerns**: Pages only coordinate layout and user actions; business rules, state, and UI primitives live in their dedicated folders.
2. **Feature Isolation**: Changes to the Kiosk touch terminal will never impact the Registrar or Accounting administrative portals.
3. **Hardware Agnostic**: RFID interactions run through an event abstraction layer, allowing easy migration between USB HID keyboard wedge readers, WebSockets, or serial COM bridges.
4. **Instant Readability**: New developers can locate components, layouts, or API routes within seconds without navigating monolithic files.
5. **Dual Serving Support**: Works seamlessly via Vite standalone dev server (`index.html`) or served through Laravel's Blade template (`app.blade.php`).
