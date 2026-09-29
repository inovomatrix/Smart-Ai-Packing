# PackSmart AI — AI-Based Intelligent Food Packaging Material Recommendation System

**Smart India Hackathon 2026 (SIH 2026)**  
**Problem Statement ID:** `SIH26236`  
**System:** Computational Decision-Support System for Food Packaging Material Optimization

---

## 🌟 Executive Summary

**PackSmart AI** is a serious, AI-powered computational decision-support system designed to solve the critical mismatch between perishable food commodities and commercial packaging materials. Instead of generic chatbot responses, PackSmart AI combines **empirical food science data**, **ASTM-standard barrier measurements**, **modular thermodynamic & respiratory rules**, **multi-objective optimization**, and **explainable AI (XAI)**.

```
                    FOOD COMMODITY INPUT
         (Moisture, aw, Respiration, Sensitivities, Storage)
                               │
                               ▼
               MODULAR SCIENTIFIC RULE ENGINE
          (ASTM D3985 OTR, ASTM F1249 WVTR, Thermal limits)
                               │
                               ▼
             MULTI-OBJECTIVE OPTIMIZATION ENGINE
         (Barrier Performance + Unit Economics + Circularity)
                               │
                               ▼
            SHELF-LIFE KINETICS DECAY MODEL (Q10)
                               │
                               ▼
              EXPLAINABLE TECHNICAL DOSSIER & PDF
         (Top Material + Specifications + Trade-Offs + Alts)
```

---

## 🛠️ Mandatory Technology Stack

* **Frontend:**
  * Vanilla HTML5 & CSS3
  * Vanilla JavaScript (ES6+ Modules)
  * Supabase JS Client via CDN (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`)
  * Chart.js for scientific radar, decay, and bar charts
* **Backend:**
  * Python 3.14 + FastAPI + Uvicorn
  * Pydantic v2 data models
  * Supabase Python SDK (`supabase-py`)
  * ReportLab for publication-grade PDF recommendation dossiers
  * NumPy & scikit-learn for attribution sensitivity analysis
* **Database & Authentication:**
  * Supabase PostgreSQL relational database with Row-Level Security (RLS)
  * Supabase Auth (Email/Password + One-Click Judge Guest Bypass)

---

## 🚀 Quick Start (Running Locally)

### 1. Launch with One Click
Double click **`run.bat`** (or execute `./run.ps1` in PowerShell).

Alternatively, from your terminal:
```bash
# 1. Activate Python virtual environment
.venv\Scripts\activate

# 2. Start the FastAPI server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Then open your browser at:  
👉 **http://localhost:8000**

---

## 🗄️ Supabase Cloud Integration

PackSmart AI operates seamlessly in **two modes**:
1. **Out-of-the-Box Local Demo Mode:** If Supabase API keys are not supplied, the app automatically runs in local SQLite/JSON cached mode so evaluators can test everything immediately without setup friction.
2. **Live Supabase Cloud Mode:** To connect directly to your live Supabase project:
   - Create a project on [supabase.com](https://supabase.com).
   - Go to **SQL Editor** and paste the contents of **`supabase_schema.sql`** to create tables and seed demo data.
   - Update your `.env` file:
     ```env
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     SUPABASE_ANON_KEY=your-anon-key
     ```
   - Update `frontend/js/supabase-config.js` with your public `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

---

## 🎯 3 One-Click Presets & SIH Demo Mode

To enable judges to evaluate the full system in under 2–3 minutes:

* **Scenario 1 — Fresh Mango (`🥭 Fresh Mango` button):**  
  Demonstrates respiration kinetics ($45 \text{ mg CO}_2/\text{kg}\cdot\text{h}$) where hermetic barrier films cause fatal anaerobic fermentation. The system recommends **Micro-Perforated Breathable Film** with MAP gas flush ($3\text{--}5\% \text{ O}_2$).
* **Scenario 2 — Potato Chips (`🥔 Potato Chips` button):**  
  Demonstrates high-fat, high-moisture sensitivity ($a_w = 0.22$). The system recommends **Metallized BOPP/LDPE Laminate** with nitrogen flushing.
* **Scenario 3 — Whole Milk Powder (`🥛 Milk Powder` button):**  
  Demonstrates extreme hygroscopicity and oxidative rancidity. The system recommends **Aluminium Foil Tri-Laminate** for maximum barrier protection.
* **`SIH Demo Mode` Button:**  
  Launches a guided 2-minute walkthrough detailing input parameters, multi-objective score calculations, trade-off matrix, decay curve, and PDF generation.

---

## 📊 Scientific Formulation Summary

1. **Arrhenius / $Q_{10}$ Temperature Kinetics:**
   $$\text{Shelf Life}(T) = \frac{\text{Baseline Days} \times \text{Barrier Factor}}{Q_{10}^{(T - T_{\text{ref}}) / 10}}$$
2. **Multi-Objective Compatibility Score:**
   $$S_{\text{overall}} = \frac{W_p \cdot S_{\text{perf}} + W_c \cdot S_{\text{cost}} + W_s \cdot S_{\text{sust}}}{W_p + W_c + W_s} - \text{Rule Penalties}$$
3. **ASTM Standard References:**
   * **ASTM D3985:** Oxygen Transmission Rate (OTR) in $\text{cc}/(\text{m}^2\cdot 24\text{h}\cdot\text{atm})$
   * **ASTM F1249:** Water Vapor Transmission Rate (WVTR) in $\text{g}/(\text{m}^2\cdot 24\text{h})$

---

## ⚠️ Scientific & Regulatory Disclaimer
> *"PackSmart AI provides computational decision-support recommendations based on peer-reviewed food science literature and barrier physics. Packaging performance, food safety, and shelf-life must be validated through appropriate laboratory testing, packaging trials, and applicable regulatory requirements before commercial deployment."*
