'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Search,
  Filter,
  ArrowUpRight,
  Wallet,
  Building2,
  User,
  Users,
  LogOut,
  ChevronRight,
  Globe,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Upload,
  Check,
  X,
  UserPlus,
  Zap,
  TrendingUp,
  Info
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

const userIcon = 'https://picsum.photos/100/100';
// --- Types & Constants ---

type Role = 'Admin' | 'Manager' | 'Employee';
type Status = 'Draft' | 'Waiting Approval' | 'Approved' | 'Rejected';
type View = 'Login' | 'Signup' | 'Dashboard' | 'Users' | 'Rules' | 'ManagerApproval' | 'ExpenseDetails';

interface Country {
  name: string;
  code: string;
  currency: string;
  symbol: string;
}

const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', currency: 'USD', symbol: '$' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£' },
  { name: 'European Union', code: 'EU', currency: 'EUR', symbol: '€' },
  { name: 'India', code: 'IN', currency: 'INR', symbol: '₹' },
  { name: 'Canada', code: 'CA', currency: 'CAD', symbol: 'CA$' },
];

const getCurrencySymbol = (currencies: any) => {
  if (!currencies) return '$';
  const firstKey = Object.keys(currencies)[0];
  return currencies[firstKey].symbol || firstKey;
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  managerId?: string;
  avatar: string;
  countryCode?: string; // For Admins to track their region
}

interface Expense {
  id: string;
  userId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: Status;
  merchant: string;
  paidBy: string;
  userName?: string; // For manager view
}

interface ApprovalRule {
  id: string;
  category: string;
  limit: number;
  autoApprove: boolean;
}

// --- Mock Data ---

const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@corp.com', password: 'password123', role: 'Employee', managerId: 'u2', avatar: userIcon, countryCode: 'US' },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@corp.com', password: 'password123', role: 'Manager', managerId: 'u3', avatar: userIcon, countryCode: 'US' },
  { id: 'u3', name: 'James Wilson', email: 'admin@example.com', password: 'admin123', role: 'Admin', avatar: userIcon, countryCode: 'US' },
  { id: 'u4', name: 'Maria Garcia', email: 'maria@corp.com', password: 'password123', role: 'Employee', managerId: 'u2', avatar: userIcon, countryCode: 'US' },
];

const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', userId: 'u1', title: 'Client Lunch', category: 'Meals', amount: 120.50, date: '2024-03-25', status: 'Approved', merchant: 'The Bistro', paidBy: 'Corporate Card', userName: 'Alex Rivera' },
  { id: 'e2', userId: 'u1', title: 'Flight to NYC', category: 'Travel', amount: 450.00, date: '2024-03-22', status: 'Waiting Approval', merchant: 'Delta Airlines', paidBy: 'Personal Card', userName: 'Alex Rivera' },
  { id: 'e3', userId: 'u4', title: 'Office Supplies', category: 'Office', amount: 45.99, date: '2024-03-20', status: 'Approved', merchant: 'Staples', paidBy: 'Corporate Card', userName: 'Maria Garcia' },
  { id: 'e4', userId: 'u4', title: 'Hotel Stay', category: 'Travel', amount: 890.00, date: '2024-03-18', status: 'Rejected', merchant: 'Marriott', paidBy: 'Personal Card', userName: 'Maria Garcia' },
  { id: 'e5', userId: 'u1', title: 'Software Subscription', category: 'Software', amount: 29.99, date: '2024-03-28', status: 'Draft', merchant: 'Adobe', paidBy: 'Personal Card', userName: 'Alex Rivera' },
];

const MOCK_RULES: ApprovalRule[] = [
  { id: 'r1', category: 'Meals', limit: 50, autoApprove: false },
  { id: 'r2', category: 'Travel', limit: 1000, autoApprove: false },
  { id: 'r3', category: 'Software', limit: 100, autoApprove: true },
];

// --- Components ---

const StatusBadge = ({ status }: { status: Status }) => {
  const styles = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Waiting Approval': 'bg-amber-50 text-amber-700 border-amber-100',
  Draft: 'bg-slate-50 text-slate-600 border-slate-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

const icons = {
  Approved: <CheckCircle2 size={14} />,
  'Waiting Approval': <Clock size={14} />,
  Draft: <FileText size={14} />,
  Rejected: <XCircle size={14} />,
};
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};

const WorkflowVisualizer = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: 'Employee', sub: 'Submission', icon: <User size={20} /> },
    { id: 2, label: 'Manager', sub: 'Review', icon: <Users size={20} /> },
    { id: 3, label: 'Finance', sub: 'Final Approval', icon: <Building2 size={20} /> },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Approval Workflow</h3>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
          Step {currentStep} of 3
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / 3) * 100}%` }}
          className="absolute top-0 left-0 h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 relative">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-3 text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' :
                isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                'bg-white border-slate-100 text-slate-300'
              }`}>
                {isCompleted ? <Check size={24} strokeWidth={3} /> : step.icon}
              </div>
              <div>
                <p className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{step.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights Section */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 mb-2">
          <Zap size={18} className="text-amber-500" />
          <h4 className="font-bold text-sm">AI Insights & Checks</h4>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <AlertCircle className="text-rose-600" size={18} />
            <div>
              <p className="text-xs font-bold text-rose-900">High amount detected</p>
              <p className="text-[10px] text-rose-700">This expense exceeds the typical range for this category.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <Globe className="text-indigo-600" size={18} />
            <div>
              <p className="text-xs font-bold text-indigo-900">Converted to company currency</p>
              <p className="text-[10px] text-indigo-700">Original: 150.00 EUR. Applied rate: 1.08 USD/EUR.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <ShieldCheck className="text-emerald-600" size={18} />
            <div>
              <p className="text-xs font-bold text-emerald-900">Matches approval rule</p>
              <p className="text-[10px] text-emerald-700">Validated against 'Standard Travel Policy' (Rule #42).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState<View>('Login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currency, setCurrency] = useState<Country>(COUNTRIES[0]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rules, setRules] = useState<ApprovalRule[]>(MOCK_RULES);
  const [allCountries, setAllCountries] = useState<Country[]>(COUNTRIES);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,cca2');
        const data = await res.json();
        const formatted = data.map((c: any) => {
          const currencyKey = Object.keys(c.currencies || {})[0];
          return {
            name: c.name.common,
            code: c.cca2,
            currency: currencyKey || 'USD',
            symbol: c.currencies?.[currencyKey]?.symbol || currencyKey || '$'
          };
        }).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAllCountries(formatted);
      } catch (e) {
        console.error("Failed to fetch countries", e);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        // Fetch profiles
        const { data: profiles } = await supabase.from('profiles').select('*');
        const mappedUsers = profiles?.map(p => ({
          id: p.id, 
          name: p.full_name || p.id, 
          email: '', 
          role: p.role as Role, 
          managerId: p.manager_id, 
          avatar: `https://picsum.photos/seed/${p.id}/100/100`, 
          countryCode: p.company_id
        })) || [];
        setUsers(mappedUsers);
        
        // Fetch expenses
        const { data: expData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (expData) {
          setExpenses(expData.map(e => ({
            id: e.id, 
            userId: e.employee_id, 
            title: e.description || 'No Description', 
            category: e.category || 'General', 
            amount: Number(e.amount), 
            date: new Date(e.created_at).toLocaleDateString(), 
            status: e.status as Status, 
            merchant: '', 
            paidBy: 'Corporate Card', 
            userName: mappedUsers.find(u => u.id === e.employee_id)?.name || 'Unknown User',
            current_approver_id: e.current_approver_id,
            approvers: e.approvers
          })));
        }
      };
      fetchData();
    }
  }, [currentView, user]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profileErr) throw profileErr;
        
        setUser({
          id: data.user.id,
          name: profile.full_name || email.split('@')[0],
          email: email,
          role: profile.role,
          managerId: profile.manager_id,
          countryCode: profile.company_id, // map company_id pseudo-field
          avatar: `https://picsum.photos/seed/${data.user.id}/100/100`
        });
        
        const targetView = profile.role === 'Admin' ? 'Users' : (profile.role === 'Manager' ? 'ManagerApproval' : 'Dashboard');
        setCurrentView(targetView as View);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials');
    }
  };

  const handleForgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Password reset instructions have been sent to your email!');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const countryCode = currency.code;

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) { setAuthError(error.message); return; }

    if (data.user) {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, name, currency: countryCode })
      });
      if (res.ok) {
        setUser({ id: data.user.id, name, email, role: 'Admin', countryCode, avatar: `https://picsum.photos/seed/${data.user.id}/100/100` });
        setCurrentView('Users'); // Admin default view
      } else {
        const errData = await res.json();
        setAuthError(errData.error || 'Failed to setup company workspace');
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as Role;
    const managerId = formData.get('managerId') as string;

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, managerId: managerId || null })
      });

      if (res.ok) {
        alert('User securely added and password emailed successfully!');
        setIsAddUserModalOpen(false);
        // Force re-fetch by toggling view quickly
        setCurrentView('Dashboard');
        setCurrentView('Users');
      } else {
        const errData = await res.json();
        alert('Error: ' + errData.error);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const expDate = formData.get('date') as string;
    const inputCurrency = formData.get('currency') as string;
    const amountVal = parseFloat(formData.get('amount') as string);
    const paidBy = formData.get('paidBy') as string;
    const remarks = formData.get('remarks') as string;

    if (!description || !expDate || isNaN(amountVal)) {
      alert("Please fill out all required fields.");
      return;
    }

    let finalAmount = amountVal;

    // Fast Exchange Rate handling
    if (inputCurrency && inputCurrency !== currency.currency) {
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${inputCurrency}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const rate = data.rates[currency.currency];
        if (rate) {
          finalAmount = amountVal * rate;
        } else {
          alert('Warning: No exchange rate found, using 1:1');
        }
      } catch (err) {
        alert('Exchange API failed. Try again.');
        return;
      }
    }

    // Fetch rules to see if we have a sequence
    const { data: rule } = await supabase
      .from('approval_rules')
      .select('*')
      .eq('company_id', user.countryCode)
      .single();

    let initialApprover = user.managerId;
    let approverFlow = [];

    if (rule && rule.sequence_enabled && rule.approver_ids?.length > 0) {
      initialApprover = rule.approver_ids[0];
      approverFlow = rule.approver_ids.map((id: string) => ({ id, status: 'Pending' }));
    }

    const { data: exp, error } = await supabase.from('expenses').insert([{
      employee_id: user.id,
      amount: finalAmount,
      currency: inputCurrency || currency.currency,
      category: category,
      description: `${description}${remarks ? ` - ${remarks}` : ''}`,
      status: 'Waiting Approval',
      current_approver_id: initialApprover,
      approvers: approverFlow,
      created_at: new Date(expDate).toISOString()
    }]).select().single();

    if (error) {
      alert("Failed to submit expense: " + error.message);
      return;
    }

    alert('Expense submitted securely using live rates!');
    setIsExpenseModalOpen(false);
    
    // Quick refresh pattern
    setCurrentView('Users');
    setCurrentView('Dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('Login');
  };

  // View Components
  const LoginPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Receipt className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ClaimOps</h1>
          <h3 className="text-2xl font-bold text-slate-900">Welcome Back</h3>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage your reimbursements</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold">
              <AlertCircle size={16} />
              {authError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input name="email" type="email" placeholder="name@company.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input name="password" type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
              <div className="flex justify-end">
              <p className="text-xs text-indigo-600 hover:underline cursor-pointer mt-1" onClick={() => setShowForgot(true)}>
                Forgot password?
              </p>
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account? <button onClick={() => { setAuthError(null); setCurrentView('Signup'); }} className="text-indigo-600 font-bold hover:underline">Sign up as Admin</button>
          <br />
          <span className="text-[10px] mt-2 block italic">Managers and Employees must be added by an Admin.</span>
        </p>
          {showForgot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80">
            <h2 className="text-lg font-bold mb-3">Reset Password</h2>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border p-2 rounded mb-3"
              id="forgotEmail"
            />

            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
              onClick={() => {
                const email = (document.getElementById("forgotEmail") as HTMLInputElement).value;
                handleForgotPassword(email);
                setShowForgot(false);
              }}
            >
              Send Reset Password
            </button>

            <button
              className="mt-2 text-sm text-gray-500 w-full"
              onClick={() => setShowForgot(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );

  const SignupPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Signup</h1>
          <p className="text-slate-500 text-sm mt-1">Set up your company's reimbursement portal</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold">
              <AlertCircle size={16} />
              {authError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input name="name" type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Email</label>
            <input name="email" type="email" placeholder="admin@company.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Create Password</label>
              <input name="password" type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
              <input name="confirmPassword" type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country (Sets Currency)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                onChange={(e) => setCurrency(allCountries.find(c => c.code === e.target.value) || allCountries[0])}
              >
                {allCountries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
            Create Admin Account
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <button onClick={() => { setAuthError(null); setCurrentView('Login'); }} className="text-indigo-600 font-bold hover:underline">Sign in</button>
        </p>
      </motion.div>
    </div>
  );

  const Sidebar = () => (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6 z-40">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <Receipt className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">ClaimOps</h1>
      </div>

      <nav className="space-y-1 flex-1">
        {user?.role === 'Employee' && (
          <button 
            onClick={() => setCurrentView('Dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'Dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutDashboard size={20} />
            My Expenses
          </button>
        )}
        
        {user?.role === 'Admin' && (
          <>
            <button 
              onClick={() => setCurrentView('Users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'Users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Users size={20} />
              User Management
            </button>
            <button 
              onClick={() => setCurrentView('Rules')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'Rules' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <ShieldCheck size={20} />
              Approval Rules
            </button>
          </>
        )}

        {(user?.role === 'Manager' || user?.role === 'Admin') && (
          <button 
            onClick={() => setCurrentView('ManagerApproval')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'ManagerApproval' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <CheckCircle2 size={20} />
             All Expenses
          </button>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
            <img src={user?.avatar} alt="Avatar" referrerPolicy="no-referrer" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  const DashboardView = () => {
    const userExpenses = expenses.filter(e => e.userId === user?.id);
    const stats = {
      total: userExpenses.reduce((acc, curr) => acc + curr.amount, 0),
      pending: userExpenses.filter(e => e.status === 'Waiting Approval').reduce((acc, curr) => acc + curr.amount, 0),
      approved: userExpenses.filter(e => e.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0),
    };

    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-slate-500 mt-1">Welcome back, {user?.name}.</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Upload size={20} />
              Upload Receipt
            </button>
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              <PlusCircle size={20} />
              New Request
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Total Expenses</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900">{currency.symbol}{stats.total.toLocaleString()}</h3>
            <div className="mt-4 p-2 bg-indigo-50 rounded-lg inline-flex text-indigo-600">
              <Wallet size={20} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Pending Approval</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900">{currency.symbol}{stats.pending.toLocaleString()}</h3>
            <div className="mt-4 p-2 bg-amber-50 rounded-lg inline-flex text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Approved Amount</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900">{currency.symbol}{stats.approved.toLocaleString()}</h3>
            <div className="mt-4 p-2 bg-emerald-50 rounded-lg inline-flex text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold">My Requests</h3>
            <div className="flex gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Filter size={18} />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Search size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Paid By</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userExpenses.map(expense => (
                  <tr 
                    key={expense.id} 
                    onClick={() => {
                      setSelectedExpense(expense);
                      setCurrentView('ExpenseDetails');
                    }}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{expense.title}</p>
                      <p className="text-xs text-slate-400">{expense.merchant}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{expense.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{expense.paidBy}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{currency.symbol}{expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4"><StatusBadge status={expense.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const ExpenseDetailsView = () => {
    if (!selectedExpense) return null;
    
    const getStep = (status: Status) => {
      if (status === 'Approved') return 3;
      if (status === 'Waiting Approval') return 2;
      return 1;
    };

    return (
      <div className="space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentView('Dashboard')}
            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
          >
            <X size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Expense Details</h2>
            <p className="text-slate-500 mt-1">Reviewing {selectedExpense.title}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {/* Main Info Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <StatusBadge status={selectedExpense.status} />
                  <h3 className="text-2xl font-bold mt-4 text-slate-900">{selectedExpense.title}</h3>
                  <p className="text-slate-500">{selectedExpense.merchant} • {selectedExpense.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-600">{currency.symbol}{selectedExpense.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{selectedExpense.category}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid By</p>
                  <p className="font-semibold text-slate-900 mt-1">{selectedExpense.paidBy}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reference ID</p>
                  <p className="font-semibold text-slate-900 mt-1">EXP-{selectedExpense.id.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">Receipt Preview</h4>
                <button className="text-indigo-600 text-sm font-bold hover:underline">Download PDF</button>
              </div>
              <div className="aspect-[4/3] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/${selectedExpense.id}/800/600`} 
                  alt="Receipt" 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <WorkflowVisualizer currentStep={getStep(selectedExpense.status)} />
          </div>
        </div>
      </div>
    );
  };

  const UsersView = () => (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500 mt-1">Manage roles and reporting lines for {currency.name}.</p>
        </div>
        <button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Manager</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.filter(u => u.countryCode === user?.countryCode).map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5 flex items-center gap-3">
                  <img src={u.avatar} className="w-10 h-10 rounded-xl border border-slate-100" alt="" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : u.role === 'Manager' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                  {u.managerId ? users.find(m => m.id === u.managerId)?.name : <span className="text-slate-300 italic">None</span>}
                </td>
                <td className="px-6 py-5">
                  <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    Active
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.filter(u => u.countryCode === user?.countryCode).length === 0 && (
          <div className="p-20 text-center">
            <Users size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No users found for this region.</p>
          </div>
        )}
      </div>
    </div>
  );

  const RulesView = () => {
    const [ruleName, setRuleName] = useState('Standard Travel Approval');
    const [selectedManager, setSelectedManager] = useState(users[1].id);
    const [isManagerApprover, setIsManagerApprover] = useState(true);
    const [followSequence, setFollowSequence] = useState(false);
    const [minApproval, setMinApproval] = useState(100);
    const [selectedApprovers, setSelectedApprovers] = useState<string[]>(['u2', 'u3']);
    const [requiredApprovers, setRequiredApprovers] = useState<string[]>(['u3']);

    const toggleApprover = (id: string) => {
      setSelectedApprovers(prev => 
        prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
      );
    };

    const toggleRequired = (id: string) => {
      setRequiredApprovers(prev => 
        prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Configure Rule</h2>
            <p className="text-slate-500 mt-1 text-sm">Define how expenses are routed and approved.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              Discard
            </button>
            <button className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
              Save Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Rule Info */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                </div>
                <h3 className="font-bold text-slate-900">Rule Information</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rule Name</label>
                  <input 
                    type="text" 
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" 
                    placeholder="e.g. Travel Policy"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Manager</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      value={selectedManager}
                      onChange={(e: any) => setSelectedManager(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none font-medium"
                    >
                      {users.filter(u => u.role !== 'Employee').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Workflow Logic</h3>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsManagerApprover(!isManagerApprover)}>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Is manager an approver?</p>
                    <p className="text-xs text-slate-500">Automatically include manager in the flow.</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${isManagerApprover ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isManagerApprover ? 'left-7' : 'left-1'}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between group cursor-pointer" onClick={() => setFollowSequence(!followSequence)}>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Follow approval sequence?</p>
                    <p className="text-xs text-slate-500">Approvers must sign off in specific order.</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${followSequence ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${followSequence ? 'left-7' : 'left-1'}`} />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min Approval Percentage</label>
                    <span className="text-indigo-600 font-bold text-lg">{minApproval}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={minApproval}
                    onChange={(e) => setMinApproval(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400 italic">Percentage of non-required approvers needed for final sign-off.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Approvers */}
          <div className="lg:col-span-7">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Approvers List</h3>
                    <p className="text-xs text-slate-500">Select and prioritize your approval chain.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    {selectedApprovers.length} Selected
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {users.map((u, index) => {
                  const isSelected = selectedApprovers.includes(u.id);
                  const isRequired = requiredApprovers.includes(u.id);
                  
                  return (
                    <motion.div  
                      key={u.id}
                      initial={false}
                      animate={{ 
                        backgroundColor: isSelected ? 'rgba(248, 250, 252, 1)' : 'rgba(255, 255, 255, 0)',
                        borderColor: isSelected ? 'rgba(226, 232, 240, 1)' : 'rgba(241, 245, 249, 0)'
                      }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${isSelected ? 'shadow-sm' : ''}`}
                      >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {followSequence && isSelected && (
                            <span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                              {selectedApprovers.indexOf(u.id) + 1}
                            </span>
                          )}
                          <button 
                            onClick={() => toggleApprover(u.id)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} className="w-10 h-10 rounded-xl border border-slate-100" alt="" referrerPolicy="no-referrer" />
                          <div>
                            <p className={`font-bold text-sm transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{u.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{u.role} • {u.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {isSelected && (
                          <div
                            onClick={() => toggleRequired(u.id)}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isRequired ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'}`}>
                              {isRequired && <Check size={10} strokeWidth={4} />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isRequired ? 'text-amber-600' : 'text-slate-400'}`}>
                              Required
                            </span>
                          </div>
                        )}

                        <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <AlertCircle className="text-indigo-600 shrink-0" size={18} />
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    <strong>Sequence Mode:</strong> Since sequence is enabled, approvals will be requested in the order shown above. Required approvers must sign off before the next person is notified.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const ManagerApprovalView = () => {
    // Show all non-draft expenses so managers can see pending and recently processed items
    
    const [tab, setTab] = useState<'Pending' | 'History'>('Pending');
    
    // Admin sees all. Manager sees only their team.
    const relevantExpenses = expenses.filter(e => {
      if (user?.role === 'Admin') return true;
      if (user?.role === 'Manager') {
        // If it's a sequence, only the current approver sees it
        if ((e as any).current_approver_id) {
          return (e as any).current_approver_id === user.id;
        }
        // Fallback: If no sequence is set, the direct reporting manager sees it
        const employee = users.find(u => u.id === e.userId);
        return employee?.managerId === user.id;
      }
      return false;
    }).filter(e => tab === 'Pending' ? e.status === 'Waiting Approval' : e.status !== 'Waiting Approval');

    const handleAction = async (id: string, newStatus: Status) => {
      try {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;

        let finalStatus = newStatus;
        let nextApproverId = null;

        // Sequence logic
        if (newStatus === 'Approved') {
          const approvers = (expense as any).approvers || [];
          const currentIndex = approvers.findIndex((a: any) => a.id === user?.id);
          
          if (currentIndex !== -1 && currentIndex < approvers.length - 1) {
            // Not the last person, just move to next
            finalStatus = 'Waiting Approval';
            nextApproverId = approvers[currentIndex + 1].id;
            
            // Update the local approver status
            approvers[currentIndex].status = 'Approved';
          }
        }

        const { error } = await supabase
          .from('expenses')
          .update({ 
            status: finalStatus,
            current_approver_id: nextApproverId,
            approvers: (expense as any).approvers
          })
          .eq('id', id);
          
        if (error) throw error;
        
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: finalStatus, current_approver_id: nextApproverId } : e));
        alert(nextApproverId ? "Approved! Sent to next manager in sequence." : `Expense ${newStatus} successfully!`);
      } catch (err: any) {
        alert("Action failed: " + err.message);
      }
    };

    return (
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Manager Approvals</h2>
            <p className="text-slate-500 mt-1">Review and process reimbursement requests from your team.</p>
          </div>
          <div className="flex gap-3">
          <button
            onClick={() => setTab('Pending')}
            className={`px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
              tab === 'Pending'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pending
          </button>

          <button
            onClick={() => setTab('History')}
            className={`px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
              tab === 'History'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            History
          </button>
        </div>
        </header>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Pending Requests</h3>
            </div>
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-indigo-100">
              {relevantExpenses.filter(e => e.status === 'Waiting Approval').length} Awaiting
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Request Owner</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantExpenses.map(expense => {
                  const isPending = expense.status === 'Waiting Approval';
                  
                  return (
                    <motion.tr 
                      layout
                      key={expense.id} 
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                            <img src={`https://picsum.photos/seed/${expense.userId}/40/40`} alt="" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{expense.userName}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Employee ID: {expense.userId.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={expense.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-lg">{currency.symbol}{expense.amount.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <TrendingUp size={10} />
                            Converted
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <AnimatePresence mode="wait">
                          {isPending ? (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex justify-end gap-3"
                            >
                              <button 
                                onClick={() => handleAction(expense.id, 'Rejected')}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
                              >
                                <X size={16} />
                                Reject
                              </button>
                              <button 
                                onClick={() => handleAction(expense.id, 'Approved')}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-100 active:scale-95"
                              >
                                <Check size={16} />
                                Approve
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-end gap-2 text-slate-400"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span className="text-xs font-bold uppercase tracking-widest italic">Processed</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {relevantExpenses.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-500 opacity-40" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Inbox Zero!</h4>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">You've successfully reviewed all pending reimbursement requests.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Render Logic ---

  if (currentView === 'Login') return <LoginPage />;
  if (currentView === 'Signup') return <SignupPage />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Sidebar />
      
      <main className="lg:ml-64 p-4 md:p-8 lg:p-10 w-full max-w-[1400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'Dashboard' && <DashboardView />}
            {currentView === 'ExpenseDetails' && <ExpenseDetailsView />}
            {currentView === 'Users' && <UsersView />}
            {currentView === 'Rules' && <RulesView />}
            {currentView === 'ManagerApproval' && <ManagerApprovalView />}
          </motion.div>
        </AnimatePresence>
      </main>

{showForgot && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-80">
      <h2 className="text-lg font-bold mb-3">Reset Password</h2>

      <input
        type="email"
        placeholder="Enter your email"
        className="w-full border p-2 rounded mb-3"
        id="forgotEmail"
      />

      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
        onClick={() => {
          const email = (document.getElementById("forgotEmail") as HTMLInputElement).value;
          handleForgotPassword(email);
          setShowForgot(false);
        }}
      >
        Send Reset Password
      </button>

      <button
        className="mt-2 text-sm text-gray-500 w-full"
        onClick={() => setShowForgot(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}
      {/* Expense Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpenseModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden my-8"
            >
              <form onSubmit={handleExpenseSubmit}>
              {/* Header & Status Tracker */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Create Request</h3>
                    <p className="text-slate-500 text-sm mt-1">Submit your reimbursement details for review.</p>
                  </div>
                  <button 
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Status Tracker */}
                <div className="relative flex justify-between items-center max-w-md mx-auto px-4">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                  <div className="absolute top-1/2 left-0 w-1/3 h-0.5 bg-indigo-600 -translate-y-1/2 z-0" />
                  
                  {[
                    { label: 'Draft', icon: <FileText size={14} />, active: true, completed: true },
                    { label: 'Waiting Approval', icon: <Clock size={14} />, active: true, completed: false },
                    { label: 'Approved', icon: <CheckCircle2 size={14} />, active: false, completed: false }
                  ].map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        step.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 
                        step.active ? 'bg-white border-indigo-600 text-indigo-600' : 
                        'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {step.completed ? <Check size={16} strokeWidth={3} /> : step.icon}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${step.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Section 1: Basic Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <LayoutDashboard size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Basic Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                      <input type="text" name="description" placeholder="e.g. Client Dinner at The Bistro" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                      <select name="category" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium">
                        {rules.map(r => <option key={r.id}>{r.category}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Expense</label>
                      <input type="date" name="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" required />
                    </div>
                  </div>
                </div>

                {/* Section 2: Financial Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Wallet size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Financial Details</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select name="currency" defaultValue={currency.currency} className="w-24 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600">
                          {allCountries.map(c => (
                            <option key={c.code} value={c.currency}>
                              {c.currency}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          name="amount"
                          step="0.01"
                          placeholder="0.00"
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          required
                        />
                      </div>

                      <p className="text-xs text-indigo-500 font-medium">
                        Converted to {currency.currency} automatically
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid By</label>
                      <select name="paidBy" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                        <option>Personal Card</option>
                        <option>Corporate Card</option>
                        <option>Cash</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Smart Insights */}
                <div className="space-y-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Smart Insights
                  </h4>

                  <div className="text-xs text-indigo-700 font-medium">
                    ⚠️ High amount detected — may require multi-level approval
                  </div>

                  <div className="text-xs text-indigo-700 font-medium">
                    💱 Converted to company currency automatically
                  </div>

                  <div className="text-xs text-indigo-700 font-medium">
                    📊 Matches approval rule: Travel Policy
                  </div>
                </div>
                {/* Approval Flow Preview */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Approval Flow
                  </h4>

                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg">Employee</span>
                    →
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg">Manager</span>
                    →
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">Finance</span>
                  </div>
                </div>
                {/* Section 3: Receipt & Remarks */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Receipt size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Evidence & Notes</h4>
                  </div>

                  <div className="space-y-4">
                    <label className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center transition-all cursor-pointer group block relative overflow-hidden hover:border-indigo-400 hover:bg-indigo-50/30">
                      <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" />
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                          <Upload size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Click to upload or take a photo of your receipt</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG or PDF up to 10MB (Manual Entry)</p>
                      </div>
                    </label>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks / Notes</label>
                      <textarea 
                        name="remarks"
                        rows={3} 
                        placeholder="Add any additional context here..." 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Approval History */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Approval History</h4>
                  </div>

                  <div className="space-y-4">
                    {[
                      { user: 'Sarah Chen', role: 'Manager', status: 'Pending', time: 'Awaiting review' },
                      { user: 'System Check', role: 'Automated', status: 'Approved', time: '2024-03-28 14:30' }
                    ].map((history, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{history.user}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{history.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={history.status as Status} />
                          <p className="text-[10px] text-slate-400 mt-1">{history.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)} 
                  className="flex-1 px-6 py-4 font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  Submit Request
                </button>
              </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <UserPlus className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Region: {currency.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input name="name" type="text" placeholder="Jane Smith" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input name="email" type="email" placeholder="jane@company.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Password</label>
                  <input name="password" type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"/>
                  <p
                    className="text-xs text-indigo-600 hover:underline cursor-pointer text-right mt-1"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                  <select name="role" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium appearance-none" required>
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting Manager</label>
                  <select name="managerId" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium appearance-none">
                    <option value="">No Manager (Direct Admin Report)</option>
                    {users.filter(u => u.role === 'Manager').map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.countryCode})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    Create User Account
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-4 italic">The user will be able to log in immediately with their email.</p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}