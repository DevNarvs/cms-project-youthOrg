export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          description: string
          president_name: string
          president_email: string
          president_phone: string
          contact_email: string
          contact_phone: string
          primary_color: string
          secondary_color: string
          active: boolean
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      app_users: {
        Row: {
          id: string
          auth_uid: string
          email: string
          role: string
          organization_id: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['app_users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['app_users']['Insert']>
      }
      programs: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string
          category: string
          age_group: string
          start_date: string | null
          end_date: string | null
          registration_required: boolean
          registration_deadline: string | null
          max_participants: number | null
          approved: boolean
          archived: boolean
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
        }
        Insert: Omit<Database['public']['Tables']['programs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['programs']['Insert']>
      }
      announcements: {
        Row: {
          id: string
          organization_id: string
          title: string
          content: string
          priority: string
          expires_at: string | null
          approved: boolean
          archived: boolean
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
        }
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>
      }
      carousel_items: {
        Row: {
          id: string
          organization_id: string
          title: string
          subtitle: string | null
          image_url: string
          link_url: string | null
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
        }
        Insert: Omit<Database['public']['Tables']['carousel_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['carousel_items']['Insert']>
      }
      org_files: {
        Row: {
          id: string
          organization_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          uploaded_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['org_files']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['org_files']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
