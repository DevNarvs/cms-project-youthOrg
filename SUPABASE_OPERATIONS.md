# Supabase Data Operations Guide

Complete guide to all data operations in the Youth Organization CMS using Supabase.

## Table of Contents
1. [Client Setup](#client-setup)
2. [Fetching Data](#fetching-data)
3. [Real-time Subscriptions](#real-time-subscriptions)
4. [Inserting Records](#inserting-records)
5. [Updating Records](#updating-records)
6. [Soft Delete (Archive)](#soft-delete-archive)
7. [File Uploads](#file-uploads)
8. [PDF Generation](#pdf-generation)
9. [Organization Restrictions](#organization-restrictions)
10. [Query Optimization](#query-optimization)
11. [Error Handling](#error-handling)

---

## Client Setup

### Basic Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Type-Safe Client

The client is typed with your database schema for autocomplete and type checking:

```typescript
// Typed queries
const { data } = await supabase
  .from('organizations')
  .select('*')

// data is typed as Organization[]
```

---

## Fetching Data

### Basic Query

```typescript
// Fetch all non-archived organizations
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('archived', false)
  .order('created_at', { ascending: false })

if (error) throw error
return data
```

### Query with Filters

```typescript
// Fetch organization's approved carousel items
const { data, error } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('organization_id', orgId)
  .eq('approved', true)
  .eq('archived', false)
  .order('display_order', { ascending: true })

if (error) throw error
return data
```

### Query with Joins

```typescript
// Fetch announcements with organization details
const { data, error } = await supabase
  .from('announcements')
  .select(`
    *,
    organizations (
      id,
      name,
      logo_url
    )
  `)
  .eq('approved', true)
  .eq('archived', false)
  .gte('publish_date', new Date().toISOString())
  .order('publish_date', { ascending: false })
  .limit(10)

if (error) throw error
return data
```

### Single Record Query

```typescript
// Fetch single organization
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', orgId)
  .maybeSingle()

if (error) throw error
return data // null if not found, no error thrown
```

### Count Query

```typescript
// Count pending items for approval
const { count, error } = await supabase
  .from('carousel_items')
  .select('*', { count: 'exact', head: true })
  .eq('approved', false)
  .eq('archived', false)

if (error) throw error
return count
```

### Pagination

```typescript
const pageSize = 20
const page = 1
const from = page * pageSize
const to = from + pageSize - 1

const { data, error, count } = await supabase
  .from('programs')
  .select('*', { count: 'exact' })
  .eq('archived', false)
  .range(from, to)
  .order('start_date', { ascending: false })

if (error) throw error

return {
  data,
  totalPages: Math.ceil((count || 0) / pageSize),
  currentPage: page
}
```

---

## Real-time Subscriptions

### Subscribe to Table Changes

```typescript
// src/hooks/useRealtimeAnnouncements.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types/database'

export function useRealtimeAnnouncements(organizationId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    // Initial fetch
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('archived', false)
        .order('publish_date', { ascending: false })

      if (data) setAnnouncements(data)
    }

    fetchAnnouncements()

    // Subscribe to changes
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAnnouncements(prev => [payload.new as Announcement, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setAnnouncements(prev =>
              prev.map(item =>
                item.id === payload.new.id ? (payload.new as Announcement) : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev =>
              prev.filter(item => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return announcements
}
```

### Subscribe to Specific Record

```typescript
// Watch for approval status changes
const channel = supabase
  .channel(`program-${programId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'programs',
      filter: `id=eq.${programId}`
    },
    (payload) => {
      const updated = payload.new as Program
      if (updated.approved) {
        toast.success('Your program has been approved!')
      }
    }
  )
  .subscribe()
```

### Presence Tracking

```typescript
// Track which admins are currently online
const channel = supabase.channel('admin-presence', {
  config: {
    presence: {
      key: userId
    }
  }
})

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    const onlineUsers = Object.keys(state)
    console.log('Online admins:', onlineUsers)
  })
  .on('presence', { event: 'join' }, ({ key }) => {
    console.log('Admin joined:', key)
  })
  .on('presence', { event: 'leave' }, ({ key }) => {
    console.log('Admin left:', key)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ online_at: new Date().toISOString() })
    }
  })
```

---

## Inserting Records

### Basic Insert

```typescript
// Create new announcement
const { data, error } = await supabase
  .from('announcements')
  .insert({
    organization_id: orgId,
    title: 'New Announcement',
    content: 'Content here',
    publish_date: new Date().toISOString(),
    approved: false,
    created_by: userId
  })
  .select()
  .single()

if (error) throw error
return data
```

### Insert Multiple Records

```typescript
// Bulk create carousel items
const items = [
  { title: 'Item 1', image_url: 'url1', display_order: 1 },
  { title: 'Item 2', image_url: 'url2', display_order: 2 },
  { title: 'Item 3', image_url: 'url3', display_order: 3 }
]

const { data, error } = await supabase
  .from('carousel_items')
  .insert(
    items.map(item => ({
      ...item,
      organization_id: orgId,
      approved: false,
      created_by: userId
    }))
  )
  .select()

if (error) throw error
return data
```

### Insert with Default Values

```typescript
// Create organization with color defaults
const { data, error } = await supabase
  .from('organizations')
  .insert({
    name: 'New Organization',
    primary_color: '#3b82f6',
    secondary_color: '#64748b',
    active: true
  })
  .select()
  .single()

if (error) throw error
return data
```

### Insert with Upsert

```typescript
// Insert or update if exists
const { data, error } = await supabase
  .from('app_settings')
  .upsert(
    {
      setting_key: 'site_name',
      setting_value: { value: 'Youth CMS' },
      updated_by: userId
    },
    {
      onConflict: 'setting_key'
    }
  )
  .select()
  .single()

if (error) throw error
return data
```

---

## Updating Records

### Basic Update

```typescript
// Update program details
const { data, error } = await supabase
  .from('programs')
  .update({
    title: 'Updated Title',
    description: 'Updated description',
    updated_by: userId
  })
  .eq('id', programId)
  .select()
  .single()

if (error) throw error
return data
```

### Update with Approval Check

```typescript
// Only update if not yet approved
const { data, error } = await supabase
  .from('carousel_items')
  .update({
    title: 'New Title',
    subtitle: 'New Subtitle',
    updated_by: userId
  })
  .eq('id', itemId)
  .eq('approved', false) // Only allow if not approved
  .select()
  .single()

if (error) {
  if (error.code === 'PGRST116') {
    throw new Error('Cannot edit approved content')
  }
  throw error
}

return data
```

### Update with Organization Check

```typescript
// Only update own organization's content
const { data, error } = await supabase
  .from('announcements')
  .update({
    title: 'Updated Title',
    content: 'Updated content',
    updated_by: userId
  })
  .eq('id', announcementId)
  .eq('organization_id', userOrgId) // Ensure ownership
  .eq('approved', false) // Not approved yet
  .select()
  .single()

if (error) throw error
return data
```

### Conditional Update

```typescript
// Update display order only if within range
const { data, error } = await supabase
  .from('carousel_items')
  .update({ display_order: newOrder })
  .eq('id', itemId)
  .gte('display_order', 0)
  .lte('display_order', 100)
  .select()
  .single()

if (error) throw error
return data
```

### Admin Approval Update

```typescript
// Admin approves content
async function approveContent(
  table: string,
  id: string,
  adminId: string
) {
  const { data, error } = await supabase
    .from(table)
    .update({
      approved: true,
      updated_by: adminId
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Usage
const approvedAnnouncement = await approveContent(
  'announcements',
  announcementId,
  adminUserId
)
```

---

## Soft Delete (Archive)

### Archive Record

```typescript
// Archive (soft delete) a program
const { data, error } = await supabase
  .from('programs')
  .update({
    archived: true,
    updated_by: userId
  })
  .eq('id', programId)
  .eq('organization_id', userOrgId) // Ensure ownership
  .select()
  .single()

if (error) throw error
return data
```

### Archive Multiple Records

```typescript
// Archive all old announcements
const cutoffDate = new Date()
cutoffDate.setMonth(cutoffDate.getMonth() - 6)

const { data, error } = await supabase
  .from('announcements')
  .update({
    archived: true,
    updated_by: userId
  })
  .eq('organization_id', orgId)
  .lt('publish_date', cutoffDate.toISOString())
  .select()

if (error) throw error
return data
```

### Restore Archived Record

```typescript
// Restore archived content
const { data, error } = await supabase
  .from('carousel_items')
  .update({
    archived: false,
    updated_by: userId
  })
  .eq('id', itemId)
  .eq('organization_id', userOrgId)
  .select()
  .single()

if (error) throw error
return data
```

### Permanently Delete

```typescript
// CAUTION: Permanent delete (use rarely)
// Only admins should have access to this
const { error } = await supabase
  .from('announcements')
  .delete()
  .eq('id', announcementId)
  .eq('archived', true) // Only delete if already archived

if (error) throw error
```

---

## File Uploads

### Image Upload for Carousel

```typescript
// src/lib/fileUpload.ts
export async function uploadCarouselImage(
  file: File,
  organizationId: string
): Promise<string> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${organizationId}/carousel/${Date.now()}.${fileExt}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('organization-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('organization-images')
    .getPublicUrl(fileName)

  return publicUrl
}

// Usage in component
const handleImageUpload = async (file: File) => {
  try {
    const imageUrl = await uploadCarouselImage(file, organizationId)

    // Create carousel item with uploaded image
    const { data } = await supabase
      .from('carousel_items')
      .insert({
        organization_id: organizationId,
        title: 'New Slide',
        image_url: imageUrl,
        display_order: 1,
        created_by: userId
      })
      .select()
      .single()

    return data
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}
```

### Logo Upload

```typescript
export async function uploadOrganizationLogo(
  file: File,
  organizationId: string
): Promise<string> {
  // Validate
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo must be less than 2MB')
  }

  // Optimize image dimensions (optional, using canvas)
  const optimized = await resizeImage(file, 400, 400)

  const fileExt = file.name.split('.').pop()
  const fileName = `${organizationId}/logo.${fileExt}`

  // Delete old logo if exists
  await supabase.storage
    .from('organization-images')
    .remove([fileName])

  // Upload new logo
  const { error } = await supabase.storage
    .from('organization-images')
    .upload(fileName, optimized, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('organization-images')
    .getPublicUrl(fileName)

  // Update organization record
  await supabase
    .from('organizations')
    .update({ logo_url: publicUrl })
    .eq('id', organizationId)

  return publicUrl
}

// Helper function to resize images
async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to resize image'))
      }, file.type)
    }

    img.onerror = reject
  })
}
```

### PDF Upload

```typescript
export async function uploadPDF(
  file: File,
  organizationId: string,
  userId: string
): Promise<void> {
  // Validate
  if (file.type !== 'application/pdf') {
    throw new Error('File must be a PDF')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('PDF must be less than 10MB')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${organizationId}/documents/${Date.now()}.${fileExt}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('organization-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('organization-files')
    .getPublicUrl(fileName)

  // Create database record
  const { error: dbError } = await supabase
    .from('org_files')
    .insert({
      organization_id: organizationId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: userId
    })

  if (dbError) throw dbError
}
```

### Gallery Upload (Multiple Images)

```typescript
export async function uploadGalleryImages(
  files: File[],
  organizationId: string,
  userId: string
): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name} is not an image`)
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`${file.name} exceeds 5MB`)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/gallery/${Date.now()}-${Math.random()}.${fileExt}`

    const { error } = await supabase.storage
      .from('organization-images')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('organization-images')
      .getPublicUrl(fileName)

    return publicUrl
  })

  const urls = await Promise.all(uploadPromises)

  // Create database records for gallery
  await supabase
    .from('org_files')
    .insert(
      urls.map(url => ({
        organization_id: organizationId,
        file_name: 'Gallery Image',
        file_url: url,
        file_type: 'image/jpeg',
        file_size: 0,
        uploaded_by: userId,
        description: 'Gallery image'
      }))
    )

  return urls
}
```

### Delete File from Storage

```typescript
export async function deleteFile(fileUrl: string): Promise<void> {
  // Extract file path from public URL
  const url = new URL(fileUrl)
  const path = url.pathname.split('/storage/v1/object/public/')[1]

  if (!path) throw new Error('Invalid file URL')

  const [bucket, ...fileParts] = path.split('/')
  const filePath = fileParts.join('/')

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) throw error
}
```

---

## PDF Generation

### Client-Side PDF Generation

```typescript
// Install: npm install jspdf jspdf-autotable

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateProgramsPDF(
  organizationId: string
): Promise<Blob> {
  // Fetch programs
  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('approved', true)
    .eq('archived', false)
    .order('start_date', { ascending: true })

  // Fetch organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', organizationId)
    .single()

  // Create PDF
  const doc = new jsPDF()

  // Add logo
  if (org?.logo_url) {
    try {
      doc.addImage(org.logo_url, 'PNG', 15, 15, 30, 30)
    } catch (error) {
      console.error('Failed to add logo:', error)
    }
  }

  // Add title
  doc.setFontSize(20)
  doc.text(`${org?.name} - Programs`, 50, 25)

  // Add generation date
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 35)

  // Add programs table
  const tableData = programs?.map(program => [
    program.title,
    new Date(program.start_date).toLocaleDateString(),
    new Date(program.end_date).toLocaleDateString(),
    program.location || 'TBD'
  ]) || []

  autoTable(doc, {
    head: [['Program', 'Start Date', 'End Date', 'Location']],
    body: tableData,
    startY: 50,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }
  })

  // Return as blob
  return doc.output('blob')
}

// Usage
const downloadProgramsPDF = async () => {
  const blob = await generateProgramsPDF(organizationId)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `programs-${Date.now()}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
```

### Server-Side PDF Generation (Edge Function)

```typescript
// supabase/functions/generate-report/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { organizationId } = await req.json()

    // Fetch data
    const { data: programs } = await supabase
      .from('programs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('approved', true)

    // Generate HTML report
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
          </style>
        </head>
        <body>
          <h1>Programs Report</h1>
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              ${programs?.map(p => `
                <tr>
                  <td>${p.title}</td>
                  <td>${new Date(p.start_date).toLocaleDateString()}</td>
                  <td>${new Date(p.end_date).toLocaleDateString()}</td>
                  <td>${p.location || 'TBD'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Return HTML (convert to PDF on client or use external service)
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

---

## Organization Restrictions

### Complete Restriction Service

```typescript
// src/lib/organizationRestrictions.ts
import { supabase } from './supabase'

export interface RestrictionCheck {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  reason?: string
}

export async function checkContentPermissions(
  table: string,
  recordId: string,
  userId: string,
  userOrgId: string | null,
  isAdmin: boolean
): Promise<RestrictionCheck> {
  // Admins can do everything
  if (isAdmin) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canApprove: true
    }
  }

  // Fetch the record
  const { data: record, error } = await supabase
    .from(table)
    .select('organization_id, approved, archived, created_by')
    .eq('id', recordId)
    .single()

  if (error || !record) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      reason: 'Record not found'
    }
  }

  // Check if user owns this content
  const isOwner = record.organization_id === userOrgId

  if (!isOwner) {
    return {
      canView: record.approved, // Can only view if approved
      canEdit: false,
      canDelete: false,
      canApprove: false,
      reason: 'Not your organization content'
    }
  }

  // Owner can view and delete their content
  // But can only edit if not yet approved
  return {
    canView: true,
    canEdit: !record.approved && !record.archived,
    canDelete: !record.archived,
    canApprove: false,
    reason: record.approved ? 'Cannot edit approved content' : undefined
  }
}

// Usage in component
const permissions = await checkContentPermissions(
  'announcements',
  announcementId,
  userId,
  userOrgId,
  isAdmin
)

if (!permissions.canEdit) {
  alert(permissions.reason || 'You cannot edit this content')
  return
}
```

### Query with Organization Filter

```typescript
// Fetch only organization's own content
export async function fetchOrganizationContent<T>(
  table: string,
  organizationId: string,
  isAdmin: boolean
): Promise<T[]> {
  let query = supabase
    .from(table)
    .select('*')
    .eq('archived', false)

  // Non-admins only see their own content
  if (!isAdmin) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data as T[]
}

// Usage
const announcements = await fetchOrganizationContent<Announcement>(
  'announcements',
  userOrgId,
  isAdmin
)
```

### Update with Approval Protection

```typescript
export async function updateWithApprovalCheck(
  table: string,
  id: string,
  updates: Record<string, unknown>,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .update({
      ...updates,
      updated_by: userId
    })
    .eq('id', id)
    .eq('organization_id', organizationId) // Must own it
    .eq('approved', false) // Must not be approved
    .eq('archived', false) // Must not be archived
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - either approved or not owned
      throw new Error('Cannot edit: content is approved or you do not have permission')
    }
    throw error
  }

  return true
}

// Usage
try {
  await updateWithApprovalCheck(
    'programs',
    programId,
    { title: 'New Title', description: 'New Description' },
    userOrgId,
    userId
  )
  toast.success('Updated successfully')
} catch (error) {
  toast.error(error.message)
}
```

---

## Query Optimization

### Use Indexes Effectively

```typescript
// Queries that use indexed columns
// Good: Uses organization_id index
const { data } = await supabase
  .from('announcements')
  .select('*')
  .eq('organization_id', orgId)
  .eq('archived', false)

// Bad: Full table scan
const { data } = await supabase
  .from('announcements')
  .select('*')
  .like('title', '%search%')
```

### Select Only Needed Columns

```typescript
// Good: Only fetch what you need
const { data } = await supabase
  .from('organizations')
  .select('id, name, logo_url')
  .eq('archived', false)

// Bad: Fetches all columns including large jsonb
const { data } = await supabase
  .from('organizations')
  .select('*')
  .eq('archived', false)
```

### Use React Query for Caching

```typescript
// src/hooks/usePrograms.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePrograms(organizationId: string) {
  return useQuery({
    queryKey: ['programs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('archived', false)
        .order('start_date', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Usage in component
const { data: programs, isLoading, error } = usePrograms(organizationId)
```

### Batch Operations

```typescript
// Instead of multiple single inserts
for (const item of items) {
  await supabase.from('table').insert(item)
}

// Use bulk insert
await supabase.from('table').insert(items)
```

---

## Error Handling

### Comprehensive Error Handler

```typescript
// src/lib/supabaseErrors.ts
export class SupabaseError extends Error {
  code: string
  details: string

  constructor(message: string, code: string, details: string) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'SupabaseError'
  }
}

export function handleSupabaseError(error: any): never {
  if (error.code === '23505') {
    throw new SupabaseError(
      'A record with this value already exists',
      'DUPLICATE',
      error.message
    )
  }

  if (error.code === '23503') {
    throw new SupabaseError(
      'Referenced record does not exist',
      'FOREIGN_KEY_VIOLATION',
      error.message
    )
  }

  if (error.code === 'PGRST116') {
    throw new SupabaseError(
      'Record not found or you do not have permission',
      'NOT_FOUND',
      error.message
    )
  }

  if (error.message?.includes('JWT')) {
    throw new SupabaseError(
      'Your session has expired. Please log in again.',
      'AUTH_ERROR',
      error.message
    )
  }

  throw new SupabaseError(
    'An unexpected error occurred',
    'UNKNOWN',
    error.message
  )
}

// Usage
try {
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name: 'Test Org' })

  if (error) handleSupabaseError(error)
  return data
} catch (error) {
  if (error instanceof SupabaseError) {
    if (error.code === 'DUPLICATE') {
      toast.error('Organization name already exists')
    } else {
      toast.error(error.message)
    }
  }
  throw error
}
```

### Retry Logic

```typescript
// src/lib/retryQuery.ts
export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors (4xx)
      if (error.code?.startsWith('23')) {
        throw error
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError!
}

// Usage
const programs = await retryQuery(async () => {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('archived', false)

  if (error) throw error
  return data
})
```

---

## Best Practices Summary

1. **Always check for errors** after Supabase operations
2. **Use type-safe queries** with Database type
3. **Implement organization restrictions** at query level
4. **Prevent editing of approved content** with database checks
5. **Use soft deletes** (archived flag) instead of hard deletes
6. **Optimize queries** by selecting only needed columns
7. **Cache data** with React Query when appropriate
8. **Handle real-time updates** for collaborative features
9. **Validate files** before upload (size, type)
10. **Use batch operations** for multiple inserts/updates
11. **Implement proper error handling** with user-friendly messages
12. **Add retry logic** for network errors
13. **Use indexes** for frequently queried columns
14. **Log operations** for audit trail
15. **Test permissions** thoroughly before deployment

---

## Complete Example: CRUD with All Features

```typescript
// src/services/announcementService.ts
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types/database'

export class AnnouncementService {
  // Fetch with organization restriction
  static async list(organizationId: string, isAdmin: boolean) {
    let query = supabase
      .from('announcements')
      .select('*')
      .eq('archived', false)

    if (!isAdmin) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query.order('publish_date', { ascending: false })

    if (error) throw error
    return data as Announcement[]
  }

  // Create new announcement
  static async create(
    data: Partial<Announcement>,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ) {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        ...data,
        organization_id: organizationId,
        approved: isAdmin, // Auto-approve if admin
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return announcement
  }

  // Update with approval check
  static async update(
    id: string,
    updates: Partial<Announcement>,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ) {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        ...updates,
        updated_by: userId
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('approved', isAdmin ? undefined : false) // Non-admins can't edit approved
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Soft delete
  static async archive(
    id: string,
    organizationId: string,
    userId: string
  ) {
    const { error } = await supabase
      .from('announcements')
      .update({
        archived: true,
        updated_by: userId
      })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error
  }

  // Admin approval
  static async approve(id: string, adminId: string) {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        approved: true,
        updated_by: adminId
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Real-time subscription
  static subscribeToChanges(
    organizationId: string,
    onInsert: (announcement: Announcement) => void,
    onUpdate: (announcement: Announcement) => void,
    onDelete: (id: string) => void
  ) {
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            onInsert(payload.new as Announcement)
          } else if (payload.eventType === 'UPDATE') {
            onUpdate(payload.new as Announcement)
          } else if (payload.eventType === 'DELETE') {
            onDelete(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
```

---

This guide covers all major Supabase operations needed for the Youth Organization CMS. Refer to specific sections as needed during development.
