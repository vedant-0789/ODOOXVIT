-- Step 1: Supabase Initialization & Database Schema
-- Requirements: companies, profiles, expenses, approval_rules with strict FK relationships.

-- 1. Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_currency VARCHAR(3) NOT NULL
);

-- 2. Profiles (Users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
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
  approvers JSONB DEFAULT '[]', -- List of {id, status}
  current_approver_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Approval Rules
CREATE TABLE approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  is_manager_approver BOOLEAN DEFAULT false,
  min_approval_percentage INT,
  sequence_enabled BOOLEAN DEFAULT false,
  approver_ids UUID[] DEFAULT '{}' -- Ordered list of approver profile IDs
);

-- Add indexes for better query performance
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_manager_id ON profiles(manager_id);
CREATE INDEX idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX idx_approval_rules_company_id ON approval_rules(company_id);
