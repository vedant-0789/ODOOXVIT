import { supabase } from '@/lib/supabase';

// Reusable Next.js data-fetching utility function that enforces RBAC
export async function fetchExpensesForUser(userId: string) {
  try {
    // 1. Fetch user's profile to get their role
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      throw new Error(profileErr?.message || 'Profile not found');
    }

    const { role, id } = profile;

    // 2. Based on role, fetch the appropriate expenses
    if (role === 'Admin') {
      // Admins can fetch all expenses
      const { data: allExpenses, error: allErr } = await supabase
        .from('expenses')
        .select(`
          *,
          profiles:employee_id(full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (allErr) throw allErr;
      return allExpenses;
    } 
    
    else if (role === 'Manager') {
      // Managers only fetch expenses where the employee_id belongs to a profile whose manager_id matches the Manager's ID
      // First, fetch the IDs of all employees managed by this user
      const { data: reports } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', id);

      const reportIds = reports?.map(r => r.id) || [];
      // Also include the manager's own expenses
      reportIds.push(id);

      const { data: managerExpenses, error: managerErr } = await supabase
        .from('expenses')
        .select(`
          *,
          profiles:employee_id(full_name)
        `)
        .in('employee_id', reportIds)
        .order('created_at', { ascending: false });

      if (managerErr) throw managerErr;
      return managerExpenses;
    } 
    
    else {
      // Employees only fetch expenses where employee_id matches their own ID
      const { data: employeeExpenses, error: employeeErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: false });

      if (employeeErr) throw employeeErr;
      return employeeExpenses;
    }

  } catch (error) {
    console.error('Error fetching expenses with RBAC:', error);
    return [];
  }
}
