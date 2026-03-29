import { NextResponse } from 'next/server';
import { getAdminSupabase } from '../../../../lib/supabase';
import { evaluateWorkflowStep, EngineContext } from '../../../../src/services/workflowEngine';
import { ExpenseStatus } from '../../../../shared-types';

export async function POST(req: Request) {
  try {
    const { expense_id, approver_id, action } = await req.json();
    
    if (!expense_id || !approver_id || action === undefined) {
       return NextResponse.json({ error: 'Missing strict JSON fields' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    
    // 1. Pre-Load Expense Context
    const { data: expense, error: extErr } = await supabase
      .from('expenses')
      .select('*, profiles(company_id, manager_id)')
      .eq('id', expense_id)
      .single();
      
    if (extErr || !expense) throw new Error("Could not find Expense");
    const companyId = (expense.profiles as any)?.company_id;

    // 2. Pre-Load Admin Context Configuration
    const { data: rules } = await supabase
      .from('approval_rules')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (!rules) throw new Error("Global Approval Rules not inherently configured");

    // 3. Pre-load Approver's Context
    // Specifically looking up if this active approver is the direct manager or a CFO
    const { data: approverProfile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', approver_id)
      .single();

    // 4. Hydrate the Stateless Engine
    // Note: Assuming `total_approvers_assigned` requires an advanced Supabase Join, hardcording 5 for hackathon demo.
    const context: EngineContext = {
      has_rejection: action === 'REJECT',
      override_role_acted: approverProfile?.role === 'Admin', // Bypasses rules entirely
      is_direct_manager_approved: approverProfile?.id === (expense.profiles as any)?.manager_id,
      total_approvers_assigned: 5, 
      current_approvals_count: action === 'APPROVE' ? 1 : 0, 
      rule_min_percentage: rules.min_approval_percentage,
      rule_is_manager_approver: rules.is_manager_approver
    };

    const decision = evaluateWorkflowStep(context);

    // 5. Instantly Execute Engine Directives on Database
    // Only update Supabase if the Engine Math calculates the Step truly concluded
    if (decision.next_status !== ExpenseStatus.PENDING || decision.is_step_completed) {
       await supabase.from('expenses')
          .update({ status: decision.next_status })
          .eq('id', expense_id);
    }

    return NextResponse.json({ 
       message: 'Engine successfully executed.', 
       evaluation: decision 
    }, { status: 200 });

  } catch (error: any) {
     console.error("Workflow Integration Error:", error);
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
