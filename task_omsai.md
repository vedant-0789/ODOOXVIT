# 🛠️ Omsai's Development Tasks (Backend & Auth Architect)

**Your Goal:** You are responsible for the foundation of the app. If the database schema, roles, and authentication don't work, nothing else will. You need to ensure the system is secure and routes users correctly based on their roles.

## 1. Supabase Initialization & Database Schema
* **Action:** Set up the Supabase project and execute the SQL scripts to create the core tables: `companies`, `profiles`, `expenses`, and `approval_rules`.
* **Requirement:** Ensure foreign key relationships are strictly defined (e.g., `manager_id` in the `profiles` table references another user's `id` in the `profiles` table).

## 2. Authentication & The "First Login" Setup Flow
* **Action:** Build the Admin Signup Page with standard fields (Name, Email, Password) and a dynamic "Country selection" dropdown.
* **Requirement 1:** When a user signs up via this page, auto-create a new Company record and assign this user the **Admin** role.
* **Requirement 2:** Fetch the base currency for the selected country using the Restcountries API and save it to the new Company record.
* **Requirement 3:** Implement a generic Signin Page that redirects users to different dashboards (Admin, Manager, or Employee) based on their role.

## 3. Admin Dashboard: User Provisioning
* **Action:** Build the interface for the Admin to create and manage users.
* **Requirement 1:** Allow the Admin to create new users "on the fly" by defining their Name, Email, Role (Employee/Manager), and assigning their direct Manager via a dropdown.
* **Requirement 2:** Implement a "Send password" button next to newly created users. This must generate a random unique password and trigger an email to that user.
* **Requirement 3:** Ensure the login page has a working "Forgot password?" link so users can reset these auto-generated passwords.

## 4. Role-Based Access Control (RBAC) Data Fetching
* **Action:** Write the database queries (or configure Supabase Row Level Security) to restrict data access.
* **Requirement 1:** Employees must only be able to query and view their own submitted expenses.
* **Requirement 2:** Managers must only be able to fetch expenses submitted by their assigned team members.
* **Requirement 3:** Admins must have global read access to view all expenses and override any approval status.