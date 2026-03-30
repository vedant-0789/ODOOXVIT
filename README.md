# 🚀 ODOOXVIT: Reimbursement Management System

![ODOOXVIT Hero](/public/odooxvit-hero.png)

## 📌 Project Overview
**ODOOXVIT** is a streamlined, premium web application built to eliminate the friction, manual errors, and lack of transparency in traditional expense reimbursement workflows. By leveraging **OCR technology** and a **dynamic approval engine**, ODOOXVIT automates receipt scanning, currency conversion, and multi-level approval cycles.

> [!IMPORTANT]
> **Hackathon Submission Note:** The entire project, including all features and integrations developed during the 8-hour sprint, is located in the **`main`** branch.

---

## ✨ Key Features

### 📸 Smart OCR Expense Capture
- **Automated Scanning:** Upload receipts (JPG/PNG) and let **Tesseract.js** automatically extract amounts, dates, and categories.
- **Intelligent Classification:** Automatically suggests expense categories based on receipt data.

### 🏧 Global Currency & Conversion
- **Multi-Currency Support:** Submit expenses in any local currency.
- **Live Conversion:** Integrated with **Exchangerate API** to convert expenses into the company's base currency for manager review and reporting.

### ⚡ Dynamic Approval Engine
- **Hierarchical Routing:** Expenses flow from Employees → Managers → Admins based on customizable rules.
- **Conditional Logic:** Enable percentage-based approvals, specific approver sequences, and hybrid rules.
- **Real-time Status Tracking:** Monitor progress through *Draft*, *Pending*, *Approved*, and *Rejected* states.

### 🔐 Role-Based Access Control (RBAC)
- **Employee Portal:** Simple dashboard for uploading receipts and tracking reimbursement history.
- **Manager Suite:** Bulk review interface with commenting for approval/rejection.
- **Admin Command Center:** Configure company-wide settings, base currencies, and global approval rules.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (React 19), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Styling/UI** | [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Backend/DB** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Auth** | [Supabase Auth](https://supabase.com/auth) |
| **OCR** | [Tesseract.js](https://tesseract.projectnaptha.com/) |
| **Communication** | [Nodemailer](https://nodemailer.com/), [Resend](https://resend.com/) |

---

## 🏗 Database Schema (Core Tables)

```sql
-- 1. Profiles (Users)
-- Roles: Admin, Manager, Employee
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  role TEXT,
  manager_id UUID REFERENCES profiles(id)
);

-- 2. Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id),
  amount DECIMAL,
  currency TEXT,
  status TEXT DEFAULT 'Draft',
  receipt_url TEXT
);
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) account

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/ODOOXVIT.git

# Navigate to project directory
cd ODOOXVIT

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your credentials (check `.env.example` for reference):
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
GMAIL_USER=your_email
GMAIL_APP_PASSWORD=your_app_password
```

### 4. Direct Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application in action.

---

## 👥 Hackathon Team
- **Omsai Rathod** - Backend & Auth Architect
- **Member 2** - Logic & Integrations Lead (OCR & Approval Engine)
- **Member 3** - Frontend & UI Designer

---

## 📜 License
Built for educational and hackathon purposes. Feel free to use and improve!
