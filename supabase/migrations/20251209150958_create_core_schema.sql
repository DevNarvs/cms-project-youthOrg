/*
  # Youth Organization CMS - Core Database Schema

  ## Overview
  Complete database schema for Youth Organization CMS with role-based access control,
  soft deletes, approval workflow, and audit trails.

  ## Tables Created

  ### 1. organizations
  - Main organization entities with branding configuration
  - Columns: id, name, logo_url, primary_color, secondary_color, archived, timestamps, audit fields
  - Soft-delete enabled via 'archived' field
  
  ### 2. app_users
  - System users (Admin and Organization roles)
  - Links to Supabase auth.users
  - Columns: id, organization_id, role, email, full_name, archived, timestamps, audit fields
  - Admin users have null organization_id
  
  ### 3. carousel_items
  - Homepage carousel/slider content
  - Columns: id, organization_id, title, description, image_url, link_url, display_order, approved, archived, timestamps, audit fields
  - Approval workflow enabled
  
  ### 4. announcements
  - News and announcements
  - Columns: id, organization_id, title, content, published_date, approved, archived, timestamps, audit fields
  - Approval workflow enabled
  
  ### 5. programs
  - Youth programs and activities
  - Columns: id, organization_id, name, description, start_date, end_date, image_url, approved, archived, timestamps, audit fields
  - Approval workflow enabled
  
  ### 6. org_files
  - File attachments (PDFs, documents, images)
  - Columns: id, organization_id, file_name, file_url, file_type, file_size, description, approved, archived, timestamps, audit fields
  - Approval workflow enabled
  
  ### 7. app_settings
  - Global application settings
  - Columns: id, setting_key, setting_value (jsonb), description, timestamps, audit fields
  - Admin-only access

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Admin role: Full access to all data
  - Organization role: 
    - Can only access their own organization's data
    - Cannot modify approved content
    - Cannot see other organizations' data
  
  ## Indexes
  - Foreign key indexes for performance
  - Composite indexes on common query patterns
  - Unique constraints where appropriate
*/

-- ============================================================================
-- TABLE: organizations
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#64748b',
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_organizations_archived ON organizations(archived);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: app_users
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('admin', 'organization')),
  email text NOT NULL,
  full_name text NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_app_users_organization_id ON app_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_archived ON app_users(archived);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: carousel_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS carousel_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  display_order integer DEFAULT 0 NOT NULL,
  approved boolean DEFAULT false NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_carousel_items_organization_id ON carousel_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_carousel_items_approved ON carousel_items(approved);
CREATE INDEX IF NOT EXISTS idx_carousel_items_archived ON carousel_items(archived);
CREATE INDEX IF NOT EXISTS idx_carousel_items_display_order ON carousel_items(display_order);
CREATE INDEX IF NOT EXISTS idx_carousel_items_org_approved_archived ON carousel_items(organization_id, approved, archived);

ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: announcements
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  published_date date DEFAULT CURRENT_DATE NOT NULL,
  approved boolean DEFAULT false NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_organization_id ON announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_approved ON announcements(approved);
CREATE INDEX IF NOT EXISTS idx_announcements_archived ON announcements(archived);
CREATE INDEX IF NOT EXISTS idx_announcements_published_date ON announcements(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_org_approved_archived ON announcements(organization_id, approved, archived);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: programs
-- ============================================================================

CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  start_date date,
  end_date date,
  image_url text,
  approved boolean DEFAULT false NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_programs_organization_id ON programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_programs_approved ON programs(approved);
CREATE INDEX IF NOT EXISTS idx_programs_archived ON programs(archived);
CREATE INDEX IF NOT EXISTS idx_programs_start_date ON programs(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_programs_org_approved_archived ON programs(organization_id, approved, archived);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: org_files
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  description text,
  approved boolean DEFAULT false NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_org_files_organization_id ON org_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_files_approved ON org_files(approved);
CREATE INDEX IF NOT EXISTS idx_org_files_archived ON org_files(archived);
CREATE INDEX IF NOT EXISTS idx_org_files_file_type ON org_files(file_type);
CREATE INDEX IF NOT EXISTS idx_org_files_org_approved_archived ON org_files(organization_id, approved, archived);

ALTER TABLE org_files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: app_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_setting_key ON app_settings(setting_key);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid() AND role = 'admin' AND archived = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Get user's organization_id
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT organization_id FROM app_users
    WHERE id = auth.uid() AND archived = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: organizations
-- ============================================================================

CREATE POLICY "Admins can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Organizations can view their own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = get_user_organization_id());

CREATE POLICY "Admins can insert organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- RLS POLICIES: app_users
-- ============================================================================

CREATE POLICY "Admins can view all users"
  ON app_users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Organizations can view users in their organization"
  ON app_users FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view their own profile"
  ON app_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can insert users"
  ON app_users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update users"
  ON app_users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can update their own profile"
  ON app_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can delete users"
  ON app_users FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- RLS POLICIES: carousel_items
-- ============================================================================

CREATE POLICY "Admins can view all carousel items"
  ON carousel_items FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Organizations can view their own carousel items"
  ON carousel_items FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Public can view approved non-archived carousel items"
  ON carousel_items FOR SELECT
  TO anon
  USING (approved = true AND archived = false);

CREATE POLICY "Admins can insert carousel items"
  ON carousel_items FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can insert their own carousel items"
  ON carousel_items FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Admins can update carousel items"
  ON carousel_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can update their own non-approved carousel items"
  ON carousel_items FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id() AND approved = false)
  WITH CHECK (organization_id = get_user_organization_id() AND approved = false);

CREATE POLICY "Admins can delete carousel items"
  ON carousel_items FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- RLS POLICIES: announcements
-- ============================================================================

CREATE POLICY "Admins can view all announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Organizations can view their own announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Public can view approved non-archived announcements"
  ON announcements FOR SELECT
  TO anon
  USING (approved = true AND archived = false);

CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can insert their own announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can update their own non-approved announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id() AND approved = false)
  WITH CHECK (organization_id = get_user_organization_id() AND approved = false);

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- RLS POLICIES: programs
-- ============================================================================

CREATE POLICY "Admins can view all programs"
  ON programs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Organizations can view their own programs"
  ON programs FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Public can view approved non-archived programs"
  ON programs FOR SELECT
  TO anon
  USING (approved = true AND archived = false);

CREATE POLICY "Admins can insert programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can insert their own programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Admins can update programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can update their own non-approved programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id() AND approved = false)
  WITH CHECK (organization_id = get_user_organization_id() AND approved = false);

CREATE POLICY "Admins can delete programs"
  ON programs FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- RLS POLICIES: org_files
-- ============================================================================

CREATE POLICY "Admins can view all files"
  ON org_files FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Organizations can view their own files"
  ON org_files FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Public can view approved non-archived files"
  ON org_files FOR SELECT
  TO anon
  USING (approved = true AND archived = false);

CREATE POLICY "Admins can insert files"
  ON org_files FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can insert their own files"
  ON org_files FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Admins can update files"
  ON org_files FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Organizations can update their own non-approved files"
  ON org_files FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id() AND approved = false)
  WITH CHECK (organization_id = get_user_organization_id() AND approved = false);

CREATE POLICY "Admins can delete files"
  ON org_files FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- RLS POLICIES: app_settings
-- ============================================================================

CREATE POLICY "Admins can view all settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete settings"
  ON app_settings FOR DELETE
  TO authenticated
  USING (is_admin());
