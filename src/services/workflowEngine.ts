import { ExpenseStatus } from '../shared-types';

/**
 * Standardized Context passed by Dev 2's HTTP controllers into the Engine.
 * We do not query the database here. Dev 2 queries the DB and passes these exact integers/booleans.
 */
export interface EngineContext {
  has_rejection: boolean; // Did anyone in this step hit "Reject"?
  override_role_acted: boolean; // Did the CFO/System Admin approve?
  is_direct_manager_approved: boolean; // Did the employee's explicit manager approve?
  
  total_approvers_assigned: number; // e.g. 5 people in the Finance group
  current_approvals_count: number; // e.g. 3 people have clicked "Approve" so far
  
  // The Admin's configured rules for this specific step
  rule_min_percentage?: number; // e.g., 60%
  rule_is_manager_approver: boolean; // true/false
}

export interface EngineResult {
  next_status: ExpenseStatus; // What the overall expense status should become
  is_step_completed: boolean; // If true, Dev 2 should move to the next sequence step (or fully Complete)
}

/**
 * The Stateless Workflow Engine
 * Evaluates mathematics and logic based on the Admin's custom Rules vs current progress.
 */
export function evaluateWorkflowStep(context: EngineContext): EngineResult {

  // ==========================================
  // RULE 0: FATAL REJECTION
  // ==========================================
  // If ANY person assigned to this step rejects the expense, it dies instantly.
  if (context.has_rejection) {
    return {
      next_status: ExpenseStatus.REJECTED,
      is_step_completed: true 
    };
  }

  // ==========================================
  // RULE 1: HIGH-LEVEL ROLE OVERRIDE 
  // ==========================================
  // If a specified Override Role (e.g., CFO) approved, forcefully bypass all remaining logic.
  if (context.override_role_acted) {
    return {
      next_status: ExpenseStatus.APPROVED, 
      is_step_completed: true
    };
  }

  // ==========================================
  // RULE 2: DIRECT MANAGER REQUIREMENT
  // ==========================================
  // If the Admin rule demands the direct manager specifically signs off, 
  // and they haven't yet, we cannot proceed further.
  if (context.rule_is_manager_approver) {
    if (!context.is_direct_manager_approved) {
       return {
         next_status: ExpenseStatus.PENDING,
         is_step_completed: false
       };
    }
  }

  // ==========================================
  // RULE 3: PERCENTAGE-BASED APPROVAL
  // ==========================================
  // "We need 60% of the Finance department to approve this before it moves forward."
  if (context.rule_min_percentage && context.total_approvers_assigned > 0) {
     const currentPercentage = (context.current_approvals_count / context.total_approvers_assigned) * 100;
     
     if (currentPercentage >= context.rule_min_percentage) {
        return {
          next_status: ExpenseStatus.APPROVED,
          is_step_completed: true
        };
     } else {
        // We haven't hit the magical percentage threshold yet. Wait for more people.
        return {
          next_status: ExpenseStatus.PENDING,
          is_step_completed: false
        };
     }
  }

  // ==========================================
  // RULE 4: DEFAULT STANDARD COMPLETION
  // ==========================================
  // If there are no complex percentage rules, we just wait for everyone assigned to the step to approve.
  if (context.current_approvals_count >= context.total_approvers_assigned && context.total_approvers_assigned > 0) {
      return {
          next_status: ExpenseStatus.APPROVED,
          is_step_completed: true
      };
  }

  // Default state: Keep waiting for action
  return {
    next_status: ExpenseStatus.PENDING,
    is_step_completed: false
  };
}
