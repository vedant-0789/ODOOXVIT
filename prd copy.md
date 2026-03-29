# 🚀 Reimbursement Management System

## 📌 Project Overview
A streamlined web application designed to eliminate manual, error-prone expense reimbursement processes. This system provides transparency through multi-level approval flows and automated expense generation via OCR[cite: 53, 54].

Built during an 8-hour hackathon sprint.

---

## 🛠 Tech Stack
* **Frontend:** Next.js (React), Tailwind CSS, shadcn/ui
* **Backend & Database:** Supabase (PostgreSQL)
* **OCR Engine:** Tesseract.js (or Mindee API)
* **Deployment:** Vercel

---

## 👥 Team Coordination & Modules

### 1️⃣ Omsai (Backend & Auth Architect)
**Focus:** Database schema, Authentication, and Role-Based Access Control.
* Set up Supabase project and PostgreSQL tables.
* Implement First-Login Logic: Auto-create Company and assign Admin user[cite: 10, 11].
* Fetch and set the environment's base currency using the Restcountries API during signup.
* Build Admin functions to create Employees/Managers and define manager relationships.

### 2️⃣ Member 2 (Logic & Integrations Lead)
**Focus:** OCR integration, Currency Conversion, and the Approval Engine.
* Implement OCR for receipts to auto-generate amount, date, description, and category.
* Integrate Exchangerate API to convert submitted expenses into the company's base currency for Manager review[cite: 19, 50, 55].
* Build the Conditional Approval Flow (Percentage rules, Specific approver rules, and Hybrid rules) [cite: 37-42].

### 3️⃣ Member 3 (Frontend & UI Designer)
**Focus:** User Interfaces and Dashboard Routing.
* Build the Authentication Pages (Signup/Signin) with country dropdown.
* Build the **Employee Dashboard**: Upload receipts, submit expenses, and view history (Draft $\rightarrow$ Waiting $\rightarrow$ Approved).
* Build the **Manager Dashboard**: View team expenses and Approve/Reject with comments.
* Build the **Admin Dashboard**: Configure approval rules and sequences.

---

## 🗄️ Shared Database Schema (PostgreSQL)
*Note: Ensure all members are referencing these table and column names when writing API calls.*

```sql
-- 1. Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_currency VARCHAR(3) NOT NULL
);

-- 2. Profiles (Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  full_name TEXT,
  role TEXT CHECK (role IN ('Admin', 'Manager', 'Employee')),
  manager_id UUID REFERENCES profiles(id)
);

-- 3. Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id),
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  category TEXT,
  description TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'Draft', -- Draft, Pending, Approved, Rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Approval Rules
CREATE TABLE approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  is_manager_approver BOOLEAN DEFAULT false,
  min_approval_percentage INT,
  sequence_enabled BOOLEAN DEFAULT false
);