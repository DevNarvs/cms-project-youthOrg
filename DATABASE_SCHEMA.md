# Database Schema Documentation

## Overview
The Youth Organization CMS uses a PostgreSQL database hosted on Supabase. The schema implements role-based access control, soft deletes, approval workflows, and comprehensive audit trails.

## Architecture Principles

### 1. Soft Deletes
All content tables include an `archived` boolean field (default: `false`). Records are never permanently deleted; instead, they are marked as archived. This allows for:
- Data recovery
- Audit trail preservation
- Historical reporting

### 2. Approval Workflow
Content tables (`carousel_items`, `announcements`, `programs`, `org_files`) include an `approved` boolean field (default: `false`). When content is approved:
- It becomes visible to the public
- Organization users can no longer edit it
- Only admins can modify or unapprove it

### 3. Audit Trails
All tables include:
- `created_at`: Timestamp of record creation
- `updated_at`: Timestamp of last update
- `created_by`: UUID reference to auth.users
- `updated_by`: UUID reference to auth.users

### 4. Row Level Security (RLS)
Every table has RLS enabled with policies that enforce:
- **Admin role**: Full access to all data
- **Organization role**: Access only to their own organization's data
- **Public/Anon**: Read-only access to approved, non-archived content

## Tables

### organizations
Stores organization entities with branding configuration.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| name | text | - | Organization name |
| logo_url | text | null | URL to organization logo |
| primary_color | text | '#3b82f6' | Primary brand color (hex) |
| secondary_color | text | '#64748b' | Secondary brand color (hex) |
| archived | boolean | false | Soft delete flag |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last update timestamp |
| created_by | uuid | null | Creator user ID |
| updated_by | uuid | null | Last updater user ID |

**Indexes:**
- `idx_organizations_archived` on `(archived)`
- `idx_organizations_created_at` on `(created_at DESC)`

**RLS Policies:**
- Admins: Full CRUD access
- Organizations: Can view their own organization only

---

### app_users
System users (both Admin and Organization roles). Links to Supabase `auth.users`.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | - | Primary key (references auth.users) |
| organization_id | uuid | null | Linked organization (null for admins) |
| role | text | - | User role: 'admin' or 'organization' |
| email | text | - | User email address |
| full_name | text | - | Full name |
| archived | boolean | false | Soft delete flag |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last update timestamp |
| created_by | uuid | null | Creator user ID |
| updated_by | uuid | null | Last updater user ID |

**Constraints:**
- CHECK: `role IN ('admin', 'organization')`
- FOREIGN KEY: `id` references `auth.users(id)` ON DELETE CASCADE
- FOREIGN KEY: `organization_id` references `organizations(id)` ON DELETE SET NULL

**Indexes:**
- `idx_app_users_organization_id` on `(organization_id)`
- `idx_app_users_role` on `(role)`
- `idx_app_users_email` on `(email)`
- `idx_app_users_archived` on `(archived)`

**RLS Policies:**
- Admins: Full CRUD access
- Organizations: Can view users in their organization
- Users: Can view and update their own profile

---

### carousel_items
Homepage carousel/slider content items.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| organization_id | uuid | - | Linked organization |
| title | text | - | Carousel item title |
| description | text | null | Optional description |
| image_url | text | - | URL to carousel image |
| link_url | text | null | Optional link destination |
| display_order | integer | 0 | Display order (lower first) |
| approved | boolean | false | Approval status |
| archived | boolean | false | Soft delete flag |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last update timestamp |
| created_by | uuid | null | Creator user ID |
| updated_by | uuid | null | Last updater user ID |

**Constraints:**
- FOREIGN KEY: `organization_id` references `organizations(id)` ON DELETE CASCADE

**Indexes:**
- `idx_carousel_items_organization_id` on `(organization_id)`
- `idx_carousel_items_approved` on `(approved)`
- `idx_carousel_items_archived` on `(archived)`
- `idx_carousel_items_display_order` on `(display_order)`
- `idx_carousel_items_org_approved_archived` on `(organization_id, approved, archived)`

**RLS Policies:**
- Admins: Full CRUD access
- Organizations: Can create and view their own; can update only non-approved items
- Public: Can view approved, non-archived items

---

### announcements
News and announcements.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| organization_id | uuid | - | Linked organization |
| title | text | - | Announcement title |
| content | text | - | Announcement content |
| published_date | date | CURRENT_DATE | Publication date |
| approved | boolean | false | Approval status |
| archived | boolean | false | Soft delete flag |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last update timestamp |
| created_by | uuid | null | Creator user ID |
| updated_by | uuid | null | Last updater user ID |

**Constraints:**
- FOREIGN KEY: `organization_id` references `organizations(id)` ON DELETE CASCADE

**Indexes:**
- `idx_announcements_organization_id` on `(organization_id)`
- `idx_announcements_approved` on `(approved)`
- `idx_announcements_archived` on `(archived)`
- `idx_announcements_published_date` on `(published_date DESC)`
- `idx_announcements_org_approved_archived` on `(organization_id, approved, archived)`

**RLS Policies:**
- Admins: Full CRUD access
- Organizations: Can create and view their own; can update only non-approved items
- Public: Can view approved, non-archived items

---

### programs
Youth programs and activities.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| organization_id | uuid | - | Linked organization |
| name | text | - | Program name |
| description | text | - | Program description |
| start_date | date | null | Program start date |
| end_date | date | null | Program end date |
| image_url | text | null | URL to program image |
| approved | boolean | false | Approval status |
| archived | boolean | false | Soft delete flag |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last update timestamp |
| created_by | uuid | null | Creator user ID |
| updated_by | uuid | null | Last updater user ID |

**Constraints:**
- FOREIGN KEY: `organization_id` references `organizations(id)` ON DELETE CASCADE
- CHECK: `end_date IS NULL OR start_date IS NULL OR end_date >= start_date`

**Indexes:**
- `idx_programs_organization_id` on `(organization_id)`
- `idx_programs_approved` on `(approved)`
- `idx_programs_archived` on `(archived)`
- `idx_programs_start_date` on `(start_date DESC)`
- `idx_programs_org_approved_archived` on `(organization_id, approved, archived)`

**RLS Policies:**
- Admins: Full CRUD access
- Organizations: Can create and view their own; can update only non-approved items
- Public: Can view approved, non-archived items

---

### org_files
File attachments (PDFs, documents, images, etc.).

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| organization_id | uuid | - | Linked organization |
| file_name | text | - | Original file name |
| file_url | text | - | URL to file in storage |
| file_type | text | - | MIME type |
| file_size | integer | - | File size in bytes |
| description | text | null | Optional description |
| approved | boolean | false | Approval status |
| archived | boolean | false | Soft delete flag |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last update timestamp |
| created_by | uuid | null | Creator user ID |
| updated_by | uuid | null | Last updater user ID |

**Constraints:**
- FOREIGN KEY: `organization_id` references `organizations(id)` ON DELETE CASCADE

**Indexes:**
- `idx_org_files_organization_id` on `(organization_id)`
- `idx_org_files_approved` on `(approved)`
- `idx_org_files_archived` on `(archived)`
- `idx_org_files_file_type` on `(file_type)`
- `idx_org_files_org_approved_archived` on `(organization_id, approved, archived)`

**RLS Policies:**
- Admins: Full CRUD access
- Organizations: Can create and view their own; can update only non-approved items
- Public: Can view approved, non-archived items

---

### app_settings
Global application settings (admin-only).

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| setting_key | text | - | Unique setting identifier |
| setting_value | jsonb | - | Setting value (JSON) |
| description | text | null | Setting description |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last update timestamp |
| created_by | uuid | null | Creator user ID |
| updated_by | uuid | null | Last updater user ID |

**Constraints:**
- UNIQUE: `setting_key`

**Indexes:**
- `idx_app_settings_setting_key` on `(setting_key)`

**RLS Policies:**
- Admins: Full CRUD access
- Organizations: No access
- Public: No access

---

## Helper Functions

### is_admin()
Returns `true` if the current user has the 'admin' role and is not archived.

```sql
SELECT is_admin();
```

### get_user_organization_id()
Returns the `organization_id` of the current authenticated user. Returns `null` for admin users.

```sql
SELECT get_user_organization_id();
```

## RLS Policy Patterns

### Admin Access Pattern
```sql
CREATE POLICY "Admins can [action] [table]"
  ON [table] FOR [SELECT|INSERT|UPDATE|DELETE]
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

### Organization Access Pattern (Read)
```sql
CREATE POLICY "Organizations can view their own [table]"
  ON [table] FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());
```

### Organization Access Pattern (Write - Non-Approved Only)
```sql
CREATE POLICY "Organizations can update their own non-approved [table]"
  ON [table] FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id() AND approved = false)
  WITH CHECK (organization_id = get_user_organization_id() AND approved = false);
```

### Public Access Pattern
```sql
CREATE POLICY "Public can view approved non-archived [table]"
  ON [table] FOR SELECT
  TO anon
  USING (approved = true AND archived = false);
```

## Relationships

```
auth.users (Supabase Auth)
    ├─→ app_users (1:1, ON DELETE CASCADE)
    │       └─→ organizations (N:1, ON DELETE SET NULL)
    │
    └─→ [all tables].created_by (N:1)
    └─→ [all tables].updated_by (N:1)

organizations
    ├─→ app_users (1:N)
    ├─→ carousel_items (1:N, ON DELETE CASCADE)
    ├─→ announcements (1:N, ON DELETE CASCADE)
    ├─→ programs (1:N, ON DELETE CASCADE)
    └─→ org_files (1:N, ON DELETE CASCADE)
```

## Usage Examples

### Query approved content for public display
```typescript
const { data } = await supabase
  .from('announcements')
  .select('*')
  .eq('approved', true)
  .eq('archived', false)
  .order('published_date', { ascending: false })
```

### Organization creating new content
```typescript
const { data, error } = await supabase
  .from('programs')
  .insert({
    organization_id: userOrgId,
    name: 'Summer Camp 2024',
    description: 'Fun activities for youth',
    approved: false,
    archived: false,
    created_by: userId,
    updated_by: userId
  })
```

### Admin approving content
```typescript
const { error } = await supabase
  .from('carousel_items')
  .update({
    approved: true,
    updated_by: adminId
  })
  .eq('id', itemId)
```

### Soft-deleting (archiving) content
```typescript
const { error } = await supabase
  .from('announcements')
  .update({
    archived: true,
    updated_by: userId
  })
  .eq('id', announcementId)
```

## Migration History
- `create_core_schema` - Initial schema with all tables, RLS policies, and helper functions
