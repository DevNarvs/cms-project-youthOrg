# Reusable UI Components Guide

## Overview
This guide documents all reusable UI components in the Youth Organization CMS. Components are organized into two categories:
1. **Base UI Components** - Foundational building blocks
2. **Feature Components** - Business logic components for CRUD operations

## Base UI Components

### Button
**Location**: `src/components/ui/Button.tsx`

Styled button component with variants and sizes.

**Props:**
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  // Extends HTMLButtonElement attributes
}
```

**Usage:**
```tsx
<Button variant="default" size="default">
  Click Me
</Button>

<Button variant="destructive" size="sm">
  <Trash2 className="h-4 w-4" />
</Button>

<Button variant="outline">
  Cancel
</Button>
```

**Variants:**
- `default` - Primary action button with brand color
- `destructive` - Dangerous actions (delete, archive)
- `outline` - Secondary actions with border
- `ghost` - Minimal styling for tertiary actions
- `secondary` - Alternative to default

**Dynamic Theming:**
The `default` variant uses CSS variables that adapt to organization colors:
```css
bg-primary text-primary-foreground hover:bg-primary/90
```

---

### Input
**Location**: `src/components/ui/Input.tsx`

Standard text input with consistent styling.

**Props:**
```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
```

**Usage:**
```tsx
<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

<Input
  type="email"
  required
  placeholder="email@example.com"
/>

<Input
  type="color"
  value="#3b82f6"
  className="w-20 h-10"
/>
```

---

### Textarea
**Location**: `src/components/ui/Textarea.tsx`

Multi-line text input component.

**Props:**
```typescript
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}
```

**Usage:**
```tsx
<Textarea
  placeholder="Enter description"
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

---

### Label
**Location**: `src/components/ui/Label.tsx`

Form label with consistent typography.

**Usage:**
```tsx
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

---

### FormField
**Location**: `src/components/ui/FormField.tsx`

Wrapper component that combines Label, Input/Textarea, and error message.

**Props:**
```typescript
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  htmlFor?: string
}
```

**Usage:**
```tsx
<FormField
  label="Email"
  required
  error={errors.email}
  htmlFor="email"
>
  <Input
    id="email"
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({...formData, email: e.target.value})}
  />
</FormField>
```

---

### Select
**Location**: `src/components/ui/Select.tsx`

Dropdown select component.

**Usage:**
```tsx
<Select value={status} onChange={(e) => setStatus(e.target.value)}>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</Select>
```

---

### Card
**Location**: `src/components/ui/Card.tsx`

Container component with multiple sub-components.

**Sub-components:**
- `Card` - Main container
- `CardHeader` - Header section with padding
- `CardTitle` - Title with consistent typography
- `CardContent` - Content area with padding

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

---

### Modal
**Location**: `src/components/ui/Modal.tsx`

Full-featured modal dialog with backdrop and keyboard support.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

**Features:**
- Backdrop click to close
- Escape key to close
- Auto-manages body scroll
- Responsive sizing

**Usage:**
```tsx
const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Item"
  description="Make changes to your item"
  size="lg"
>
  <form>
    {/* Form content */}
  </form>
</Modal>
```

---

### ConfirmDialog
**Location**: `src/components/ui/ConfirmDialog.tsx`

Specialized modal for confirmation actions.

**Props:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}
```

**Usage:**
```tsx
<ConfirmDialog
  isOpen={deleteConfirm !== null}
  onClose={() => setDeleteConfirm(null)}
  onConfirm={() => deleteItem(deleteConfirm)}
  title="Delete Item"
  description="Are you sure? This action cannot be undone."
  confirmText="Delete"
  variant="destructive"
  loading={isDeleting}
/>
```

---

## Feature Components

### CarouselManager
**Location**: `src/components/features/CarouselManager.tsx`

Full CRUD interface for managing carousel items.

**Features:**
- Create/Edit/Delete carousel items
- Image preview
- Display order management
- Approval status (admin only)
- Grid layout with cards
- Empty state

**Data Structure:**
```typescript
interface CarouselFormData {
  title: string
  subtitle: string
  image_url: string
  link_url: string
  display_order: number
}
```

**Permissions:**
- Organizations: Can create/edit their own items
- Admin: Can approve/reject all items

**Usage:**
```tsx
import { CarouselManager } from '@/components/features/CarouselManager'

// In admin or organization dashboard
<CarouselManager />
```

**Key Features:**
- React Query for data fetching and caching
- Optimistic updates on approval toggle
- Validation for required fields
- Soft delete (archived flag)

---

### AnnouncementEditor
**Location**: `src/components/features/AnnouncementEditor.tsx`

Full CRUD interface for managing announcements.

**Features:**
- Create/Edit/Delete announcements
- Date-based publishing
- Rich text content
- Approval workflow
- List view with cards

**Data Structure:**
```typescript
interface AnnouncementFormData {
  title: string
  content: string
  publish_date: string
}
```

**Usage:**
```tsx
import { AnnouncementEditor } from '@/components/features/AnnouncementEditor'

<AnnouncementEditor />
```

**Key Features:**
- Date picker for publish date
- Multiline content with whitespace preservation
- Formatted date display using date-fns
- Sort by publish date (most recent first)

---

### ProgramsEditor
**Location**: `src/components/features/ProgramsEditor.tsx`

Full CRUD interface for managing programs.

**Features:**
- Create/Edit/Delete programs
- Date range (start/end)
- Location information
- Registration URL
- Optional image
- Approval workflow

**Data Structure:**
```typescript
interface ProgramFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  registration_url: string
  image_url: string
}
```

**Usage:**
```tsx
import { ProgramsEditor } from '@/components/features/ProgramsEditor'

<ProgramsEditor />
```

**Validation:**
- End date must be after start date
- All URLs validated
- Required fields enforced

---

### OrganizationManager
**Location**: `src/components/features/OrganizationManager.tsx`

Admin-only interface for managing organizations.

**Features:**
- Create/Edit/Delete organizations
- Logo management
- Color palette configuration
- Contact information
- Active/inactive status toggle
- Grid layout with organization cards

**Data Structure:**
```typescript
interface OrganizationFormData {
  name: string
  description: string
  website_url: string
  contact_email: string
  contact_phone: string
  logo_url: string
  primary_color: string
  secondary_color: string
}
```

**Usage:**
```tsx
import { OrganizationManager } from '@/components/features/OrganizationManager'

// Admin dashboard only
{isAdmin && <OrganizationManager />}
```

**Color Picker:**
- Visual color picker (type="color")
- Hex input for precise control
- Live preview of selected colors
- Validates hex format

**Permissions:**
- Admin only - automatically checks role
- Shows error if non-admin attempts access

---

### FileUploader
**Location**: `src/components/features/FileUploader.tsx`

File management interface with Supabase Storage integration.

**Features:**
- File upload to Supabase Storage
- File type detection
- Size limit enforcement (10MB)
- File preview icons
- Download files
- Delete files
- Formatted file sizes

**Usage:**
```tsx
import { FileUploader } from '@/components/features/FileUploader'

// Organization dashboard
<FileUploader />
```

**Supported File Types:**
- Images (image/*)
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)

**Storage Structure:**
```
organization-files/
  {organization_id}/
    {timestamp}.{extension}
```

**Key Features:**
- Hidden file input with custom trigger button
- Upload progress indication
- Error handling with user feedback
- Public URL generation
- Database record creation

---

### PaletteManager
**Location**: `src/components/features/PaletteManager.tsx`

Organization color palette customization interface.

**Features:**
- Custom color selection
- Color presets
- Live preview mode
- Visual color picker + hex input
- Preview components with new colors
- Reset functionality

**Data Structure:**
```typescript
interface ColorFormData {
  primary_color: string
  secondary_color: string
}
```

**Color Presets:**
- Blue (default)
- Green
- Red
- Orange
- Teal
- Pink

**Usage:**
```tsx
import { PaletteManager } from '@/components/features/PaletteManager'

// Organization dashboard
{isOrganization && <PaletteManager />}
```

**Preview Mode:**
1. User selects colors
2. Clicks "Preview" to apply temporarily
3. System updates CSS variables in real-time
4. User can "Reset" or "Save Changes"
5. Save persists to database and updates theme context

**Dynamic Theming Integration:**
```typescript
// Updates CSS variables
updateTheme(primaryColor, secondaryColor)

// CSS variables updated:
--primary: {hsl-value}
```

---

## Common Patterns

### React Query Setup

All feature components use React Query for data management:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', organizationId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('archived', false)

    if (error) throw error
    return data
  }
})
```

**Mutations:**
```tsx
const createMutation = useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase
      .from('table')
      .insert(data)
    if (error) throw error
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] })
    closeModal()
  }
})
```

---

### Form Validation Pattern

All editors follow this validation pattern:

```tsx
const validate = (): boolean => {
  const newErrors: Partial<FormData> = {}

  if (!formData.field.trim()) {
    newErrors.field = 'Field is required'
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (!validate()) return

  if (editingItem) {
    updateMutation.mutate({ id: editingItem.id, data: formData })
  } else {
    createMutation.mutate(formData)
  }
}
```

---

### Modal State Management

Standard pattern for modal operations:

```tsx
const [isModalOpen, setIsModalOpen] = useState(false)
const [editingItem, setEditingItem] = useState<Item | null>(null)
const [formData, setFormData] = useState<FormData>(initialState)

const openModal = (item?: Item) => {
  if (item) {
    setEditingItem(item)
    setFormData(mapItemToForm(item))
  } else {
    setEditingItem(null)
    setFormData(initialState)
  }
  setIsModalOpen(true)
}

const closeModal = () => {
  setIsModalOpen(false)
  setEditingItem(null)
  setFormData(initialState)
  setErrors({})
}
```

---

### Delete Confirmation Pattern

All components use this pattern for deletions:

```tsx
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase
      .from('table')
      .update({ archived: true })
      .eq('id', id)
    if (error) throw error
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] })
    setDeleteConfirm(null)
  }
})

// In JSX:
<Button onClick={() => setDeleteConfirm(item.id)}>Delete</Button>

<ConfirmDialog
  isOpen={deleteConfirm !== null}
  onClose={() => setDeleteConfirm(null)}
  onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
  title="Delete Item"
  description="Are you sure?"
  variant="destructive"
/>
```

---

## Styling and Theming

### TailwindCSS Classes

All components use Tailwind utility classes with the `cn()` helper:

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className
)} />
```

### Dynamic Colors

Components use CSS variables that update based on organization theme:

**CSS Variables:**
```css
--primary: {hsl-value}
--primary-foreground: {hsl-value}
--secondary: {hsl-value}
--secondary-foreground: {hsl-value}
```

**Usage in Classes:**
```tsx
<button className="bg-primary text-primary-foreground">
  Primary Action
</button>
```

**Runtime Updates:**
The ThemeContext updates these variables when organization changes:

```typescript
// ThemeContext updates root CSS variables
document.documentElement.style.setProperty('--primary', hslValue)
```

---

## Permissions and Access Control

### Role Checking

Components check user roles before rendering:

```tsx
const { isAdmin, isOrganization } = useAuth()

if (!isAdmin) {
  return <ErrorMessage message="Admin access required" />
}
```

### Data Filtering

Queries automatically filter by organization:

```tsx
let query = supabase.from('table').select('*')

if (!isAdmin && appUser?.organization_id) {
  query = query.eq('organization_id', appUser.organization_id)
}
```

### Approval Actions

Only admins can approve/reject content:

```tsx
{isAdmin && (
  <Button onClick={() => toggleApproval(item.id)}>
    {item.approved ? 'Unapprove' : 'Approve'}
  </Button>
)}
```

---

## Error Handling

### Loading States

```tsx
if (isLoading) return <LoadingSpinner />
```

### Error States

```tsx
if (error) return <ErrorMessage message="Failed to load data" />
```

### Empty States

```tsx
{items.length === 0 && (
  <EmptyState
    icon={<Icon />}
    title="No items"
    description="Get started by creating your first item"
    action={<Button onClick={openModal}>Create</Button>}
  />
)}
```

### Form Errors

```tsx
<FormField error={errors.fieldName}>
  <Input />
</FormField>
```

---

## Best Practices

1. **Always use React Query** for server state management
2. **Validate on submit** not on every keystroke
3. **Provide loading states** for all async operations
4. **Show confirmation dialogs** for destructive actions
5. **Use soft deletes** (archived flag) instead of hard deletes
6. **Filter by organization** for non-admin users
7. **Invalidate queries** after mutations
8. **Close modals** after successful operations
9. **Show empty states** when no data exists
10. **Use semantic HTML** and proper accessibility attributes

---

## Component Composition Example

Here's how components work together:

```tsx
function MyDashboard() {
  return (
    <OrgLayout>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Content</CardTitle>
          </CardHeader>
          <CardContent>
            <CarouselManager />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementEditor />
          </CardContent>
        </Card>
      </div>
    </OrgLayout>
  )
}
```

---

## Testing Components

When testing components, verify:

1. **Rendering**: Component renders without errors
2. **Loading**: Shows loading state during data fetch
3. **Empty**: Shows empty state when no data
4. **CRUD Operations**: Create, read, update, delete work
5. **Validation**: Form validation catches errors
6. **Permissions**: Role-based access enforced
7. **Errors**: Error states display properly
8. **Responsive**: Works on mobile and desktop

---

## Future Enhancements

Potential improvements for components:

1. **Rich Text Editor**: Replace textarea with WYSIWYG editor
2. **Image Upload**: Direct upload instead of URL input
3. **Drag & Drop**: Reorder carousel items visually
4. **Bulk Operations**: Select and delete multiple items
5. **Search/Filter**: Add search to large lists
6. **Pagination**: Paginate long lists
7. **Export**: Export data to CSV/PDF
8. **Activity Log**: Track changes to items
9. **Undo/Redo**: Revert recent changes
10. **Keyboard Shortcuts**: Power user features
