export type UserRole = 'admin' | 'organization'

export interface Organization {
  id: string
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
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
  description: string | null
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
  published_date: string
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
  name: string
  description: string
  start_date: string | null
  end_date: string | null
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
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      app_users: {
        Row: AppUser
        Insert: {
          id: string
          organization_id?: string | null
          role: UserRole
          email: string
          full_name: string
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          role?: UserRole
          email?: string
          full_name?: string
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      carousel_items: {
        Row: CarouselItem
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          image_url: string
          link_url?: string | null
          display_order?: number
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          image_url?: string
          link_url?: string | null
          display_order?: number
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      announcements: {
        Row: Announcement
        Insert: {
          id?: string
          organization_id: string
          title: string
          content: string
          published_date?: string
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          content?: string
          published_date?: string
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      programs: {
        Row: Program
        Insert: {
          id?: string
          organization_id: string
          name: string
          description: string
          start_date?: string | null
          end_date?: string | null
          image_url?: string | null
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string
          start_date?: string | null
          end_date?: string | null
          image_url?: string | null
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      org_files: {
        Row: OrgFile
        Insert: {
          id?: string
          organization_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          description?: string | null
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          description?: string | null
          approved?: boolean
          archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      app_settings: {
        Row: AppSetting
        Insert: {
          id?: string
          setting_key: string
          setting_value: Record<string, unknown>
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Record<string, unknown>
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
    }
  }
}
