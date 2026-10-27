# FairShift — A Decent Work Platform for Employee-Intensive Organisations
> **UN Sustainable Development Goal (SDG) 8:** Decent Work and Economic Growth (Targets 8.5, 8.8, and 8.2).

FairShift is a fast, offline-first Progressive Web Application (PWA) designed for frontline workers and operational supervisors across two high-turnover, employee-intensive industries:
1. **Construction Sites** (*Metro Infra Corp*)
2. **Hospital Support Staff** (*City General Hospital*)

---

## 🎯 UN SDG 8 Target Alignment

| Target | Description | How FairShift Delivers |
|---|---|---|
| **SDG 8.5** | *Full & productive employment and equal pay for work of equal value.* | Transparent automated payslips with zero contractor cuts, base hour tracking, and exact 1.5× overtime & 25% night shift differential calculations. |
| **SDG 8.8** | *Protect labour rights and promote safe and secure working environments.* | Multilingual voice reporting with anonymous whistleblower protection, real-time fatigue alerting (>48h limit), and supportive paid rest scheduling. |
| **SDG 8.2** | *Achieve higher levels of economic productivity through diversification and technological upgrading.* | Verifiable, portable digital skill passports with simulated high-density tamper-proof QR codes, allowing workers to carry certified experience across employers without starting from scratch. |

---

## 🌟 Core Features

### 👷 Frontline Worker Interface (`#worker-view`)
- **Smart Attendance & Shift Tracker (`#tab-attendance`):**
  - One-tap Geo-Verified Check-In and End-Shift logging.
  - Live elapsed shift timer with an interactive `+1h Overtime (Demo)` calculator.
  - Transparent itemized payslip breakdown (Base + Overtime + Night Differential) showing ₹0 contractor cuts.
  - Accessible Text-to-Speech audio payslip reader via native Web Speech API in English, हिन्दी (Hindi), and தமிழ் (Tamil).
  - Dynamic workload fatigue alert banner (Normal `<40h`, Overtime `40–48h`, and Critical `>48h`).

- **Voice Grievance & Hazard Reporting (`#tab-voice-report`):**
  - Regional spoken voice recording (Web Speech API) supporting Hindi, Tamil, Telugu, and English.
  - 1-click Quick Demo Voice samples for rapid evaluator testing.
  - Dual AI Structuring: Live Gemini 2.5 Flash (via runtime memory key, zero hardcoding) or built-in deterministic Smart NLP Engine.
  - 🔒 Anonymous Whistleblower submission mode protecting worker identity.
  - Offline draft queue (`fairshift_offline_drafts`) with auto-sync and reference IDs (e.g. `#FS-8492`).
  - 4-stage resolution pipeline (`Submitted` ➔ `Under Review` ➔ `Action Taken` ➔ `Resolved`).

- **Verified Portable Skill Passport (`#tab-skill-passport`):**
  - Digital credential identity displaying cumulative verified experience hours and safety scores.
  - Dynamic industry certifications grid with renewal warnings.
  - Self-service training logging and supervisor verification request mechanism.
  - Printable / Shareable Universal Worker CV modal with verified work history and simulated QR verification code.

---

### 📋 Supervisor Command Center (`#supervisor-view`)
- **Real-Time Synchronized KPIs:** Active workforce on-shift count, fatigue & overtime violations, open critical safety hazards, and skill compliance rate.
- **Safety & Grievance Command Center:** Filter by critical hazards or anonymous reports, update resolution stages (1 to 4), and assign supervisor notes directly reflected on the worker's device.
- **Supportive Fatigue & Shift Management:** Non-punitive shift rebalancing with a one-click `"Schedule Paid Rest"` directive that clears fatigue flags without docking wages.
- **Skill Verification Matrix:** Review and approve pending worker training requests with one click.
- **On-Demand Analytics Drawer:** Lightweight, performant SVG/CSS charts showing grievances by category and workforce overtime tiers without external charting bloat.

---

## 🚀 Running Locally

### Option 1: Native Python HTTP Server
No installation or build steps required!
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: Docker / Google Cloud Run
Build and run the lightweight container (under 30 MB compressed):
```bash
# Build the container
docker build -t fairshift .

# Run container on port 8080
docker run -p 8080:8080 fairshift
```
Open [http://localhost:8080](http://localhost:8080).

---

## 🛡️ Security, Privacy & Performance Audit
- **Zero Hardcoded Secrets:** No API keys, tokens, or private credentials are in source code. Any AI integration key is loaded into runtime browser memory only upon user request.
- **XSS-Safe Architecture:** Dynamic text is strictly sanitized using `sanitizeHTML()` and `sanitizeAttr()` before DOM insertion.
- **Offline & Low-Bandwidth Optimized:** Fully functional offline using a Service Worker cache and `localStorage`. Entire source footprint is < 1 MB.
