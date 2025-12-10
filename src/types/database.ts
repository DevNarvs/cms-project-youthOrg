export type UserRole = 'admin' | 'organization'

export interface Organization {
  id: string
  name: string
  description: string | null
  website_url: string | null
  contact_email: string | null
  contact_phone: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  active: boolean
  archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface AppUser {
  id: string
  organization_id: string | null
  role: UserRole
  email: string
  full_name: string
  archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CarouselItem {
  id: string
  organization_id: string
  title: string
  subtitle: string | null
  image_url: string
  link_url: string | null
  display_order: number
  approved: boolean
  archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface Announcement {
  id: string
  organization_id: string
  title: string
  content: string
  publish_date: string
  approved: boolean
  archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface Program {
  id: string
  organization_id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string | null
  registration_url: string | null
  image_url: string | null
  approved: boolean
  archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface OrgFile {
  id: string
  organization_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  description: string | null
  uploaded_by: string | null
  approved: boolean
  archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export type FileItem = OrgFile

export interface AppSetting {
  id: string
  setting_key: string
  setting_value: Record<string, unknown>
  description: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Organization, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      app_users: {
        Row: AppUser
        Insert: Omit<AppUser, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<AppUser, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      carousel_items: {
        Row: CarouselItem
        Insert: Omit<CarouselItem, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<CarouselItem, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Announcement, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      programs: {
        Row: Program
        Insert: Omit<Program, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Program, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      org_files: {
        Row: OrgFile
        Insert: Omit<OrgFile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<OrgFile, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      app_settings: {
        Row: AppSetting
        Insert: Omit<AppSetting, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<AppSetting, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
    }
  }
}
