import { supabase } from '@/lib/supabase'

export interface PermissionCheck {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  reason?: string
}

export class DataService {
  static async checkPermissions(
    table: string,
    recordId: string,
    userId: string,
    userOrgId: string | null,
    isAdmin: boolean
  ): Promise<PermissionCheck> {
    if (isAdmin) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canApprove: true
      }
    }

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

    const isOwner = record.organization_id === userOrgId

    if (!isOwner) {
      return {
        canView: record.approved,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        reason: 'Not your organization content'
      }
    }

    return {
      canView: true,
      canEdit: !record.approved && !record.archived,
      canDelete: !record.archived,
      canApprove: false,
      reason: record.approved ? 'Cannot edit approved content' : undefined
    }
  }

  static async fetchWithOrgFilter<T>(
    table: string,
    organizationId: string,
    isAdmin: boolean,
    additionalFilters?: Record<string, unknown>
  ): Promise<T[]> {
    let query = supabase
      .from(table)
      .select('*')
      .eq('archived', false)

    if (!isAdmin) {
      query = query.eq('organization_id', organizationId)
    }

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as T[]
  }

  static async updateWithApprovalCheck(
    table: string,
    id: string,
    updates: Record<string, unknown>,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<boolean> {
    const updateData = {
      ...updates,
      updated_by: userId
    }

    let query = supabase
      .from(table)
      .update(updateData as any)
      .eq('id', id)

    if (!isAdmin) {
      query = query
        .eq('organization_id', organizationId)
        .eq('approved', false)
        .eq('archived', false)
    }

    const { data, error } = await query.select().single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Cannot edit: content is approved or you do not have permission')
      }
      throw error
    }

    return true
  }

  static async softDelete(
    table: string,
    id: string,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<void> {
    let query = supabase
      .from(table)
      .update({
        archived: true,
        updated_by: userId
      } as any)
      .eq('id', id)

    if (!isAdmin) {
      query = query.eq('organization_id', organizationId)
    }

    const { error } = await query

    if (error) throw error
  }

  static async restore(
    table: string,
    id: string,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<void> {
    let query = supabase
      .from(table)
      .update({
        archived: false,
        updated_by: userId
      } as any)
      .eq('id', id)

    if (!isAdmin) {
      query = query.eq('organization_id', organizationId)
    }

    const { error } = await query

    if (error) throw error
  }

  static async approve(
    table: string,
    id: string,
    adminId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(table)
      .update({
        approved: true,
        updated_by: adminId
      } as any)
      .eq('id', id)

    if (error) throw error
  }

  static async reject(
    table: string,
    id: string,
    adminId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(table)
      .update({
        approved: false,
        updated_by: adminId
      } as any)
      .eq('id', id)

    if (error) throw error
  }

  static async getPendingCount(
    table: string,
    organizationId?: string
  ): Promise<number> {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('approved', false)
      .eq('archived', false)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  }

  static async batchApprove(
    table: string,
    ids: string[],
    adminId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(table)
      .update({
        approved: true,
        updated_by: adminId
      } as any)
      .in('id', ids)

    if (error) throw error
  }

  static async batchArchive(
    table: string,
    ids: string[],
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(table)
      .update({
        archived: true,
        updated_by: userId
      } as any)
      .in('id', ids)

    if (error) throw error
  }
}

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

      const errorCode = (error as any).code
      if (errorCode && errorCode.startsWith('23')) {
        throw error
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError!
}
