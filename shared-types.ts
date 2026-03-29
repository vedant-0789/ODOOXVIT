// ==========================================
// DATABASE SCHEMA INTERFACES (From prd.md Supabase schema)
// ==========================================

export enum ExpenseStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  EMPLOYEE = 'Employee',
}

export interface DBCompany {
  id: string; // UUID
  name: string;
  base_currency: string; // e.g., 'INR'
}

export interface DBProfile {
  id: string; // UUID
  company_id: string; // UUID
  full_name: string;
  role: UserRole;
  manager_id?: string; // UUID
}

export interface DBExpense {
  id: string; // UUID
  employee_id: string; // UUID
  amount: number; // Decimal
  currency: string; // e.g., 'USD'
  category?: string;
  description?: string;
  receipt_url?: string;
  status: ExpenseStatus; // Defaults to 'Draft'
  created_at: string; // TIMESTAMP
}

export interface DBApprovalRule {
  id: string; // UUID
  company_id: string; // UUID
  is_manager_approver: boolean;
  min_approval_percentage?: number;
  sequence_enabled: boolean;
}

// ==========================================
// TASK 1: OCR INTEGRATION DTOs
// ==========================================

export interface OcrProcessRequest {
  image_url: string; // Matches receipt_url from the DB
}

export interface OcrProcessResult {
  // Directly maps to DBExpense:
  total_amount: number;       // maps to DBExpense.amount
  category: string;           // maps to DBExpense.category
  
  // Does not have a direct DB column, likely concatenated into DBExpense.description
  expense_date: string;       
  description: string;        
  merchant_name: string;      
}

// ==========================================
// TASK 2: CURRENCY CONVERSION DTOs
// ==========================================

export interface CurrencyConversionRequest {
  submitted_amount: number;
  submitted_currency: string; 
  company_base_currency: string; 
}

export interface CurrencyConversionResult {
  converted_amount: number;
  exchange_rate: number;
}

// ==========================================
// TASK 3 & 4: WORKFLOW & APPROVAL RULES DTOs
// ==========================================

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

// Action submitted by an approver
export interface SubmitApprovalRequestDTO {
  expense_id: string; // UUID
  approver_id: string; // UUID
  action: ApprovalAction;
  comments?: string;
}

// Evaluation object used conditionally in the sequence
export interface WorkflowEvaluationContext {
  expense_id: string;
  company_id: string;
  employee_manager_id: string | null;
  // Pre-loaded data for rule checks
  admin_rules: DBApprovalRule;
  total_approvers_assigned: number;
  current_approvals_count: number;
  override_role_acted: boolean; // e.g., CFO action
}

export interface WorkflowEvaluationResult {
  next_status: ExpenseStatus;
  is_sequence_finished: boolean;
  next_step_approver_role?: string; 
}
