import { evaluateWorkflowStep, EngineContext } from '../services/workflowEngine';
import { ExpenseStatus } from '../shared-types';

/**
 * Step 4: Mock Data & Local Verification
 * This script proves that Dev 2 can hook up our pure functions to their endpoints
 * and they will accurately execute the Admin's business logic.
 */

function runTests() {
  console.log("🚀 Running Workflow Engine Tests...");

  console.log("\n--- TEST CASE 1: The CFO Override ---");
  const cfoContext: EngineContext = {
    has_rejection: false,
    override_role_acted: true, // CFO pressed approve!
    is_direct_manager_approved: false, // Manager hasn't even seen it yet
    total_approvers_assigned: 5,
    current_approvals_count: 1, // Only 1 person acted
    rule_min_percentage: 100, // Normally requires 100%
    rule_is_manager_approver: true
  };
  const result1 = evaluateWorkflowStep(cfoContext);
  console.log("Expected: APPROVED / Completed: true");
  console.log(`Actual: ${result1.next_status} / Completed: ${result1.is_step_completed}`);


  console.log("\n--- TEST CASE 2: The 60% Finance Rule (Still Waiting) ---");
  // Admin says: We need 60% of the 5 Finance members to pass (3 people).
  // Currently, only 2 people have approved.
  const waitingContext: EngineContext = {
    has_rejection: false,
    override_role_acted: false,
    is_direct_manager_approved: true, // Manager already approved
    total_approvers_assigned: 5,
    current_approvals_count: 2, // (2/5) = 40%
    rule_min_percentage: 60,
    rule_is_manager_approver: false
  };
  const result2 = evaluateWorkflowStep(waitingContext);
  console.log("Expected: PENDING / Completed: false");
  console.log(`Actual:   ${result2.next_status} / Completed: ${result2.is_step_completed}`);


  console.log("\n--- TEST CASE 3: The 60% Finance Rule (Threshold Met) ---");
  // The 3rd person clicks approve!
  const passedContext = { ...waitingContext, current_approvals_count: 3 }; // (3/5) = 60%
  const result3 = evaluateWorkflowStep(passedContext);
  console.log("Expected: APPROVED / Completed: true");
  console.log(`Actual:   ${result3.next_status} / Completed: ${result3.is_step_completed}`);


  console.log("\n--- TEST CASE 4: The Fatal Rejection ---");
  // Manager rejected the expense immediately
  const rejectContext: EngineContext = {
    has_rejection: true,
    override_role_acted: false,
    is_direct_manager_approved: false,
    total_approvers_assigned: 1,
    current_approvals_count: 0,
    rule_is_manager_approver: true
  };
  const result4 = evaluateWorkflowStep(rejectContext);
  console.log("Expected: REJECTED / Completed: true");
  console.log(`Actual:   ${result4.next_status} / Completed: ${result4.is_step_completed}`);
}

runTests();
