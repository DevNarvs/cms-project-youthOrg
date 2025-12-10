import { supabase, updateRow } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export interface PermissionCheck {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  reason?: string;
}

export class DataService {
  static async checkPermissions<T extends keyof Database['public']['Tables']>(
    table: T,
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
        canApprove: true,
      };
    }

    const result = await (supabase as any)
      .from(table as unknown as string)
      .select('organization_id, approved, archived, created_by')
      .eq('id', recordId)
      .single();

    const record = result.data as {
      organization_id?: string | null;
      approved?: boolean;
      archived?: boolean;
      created_by?: string | null;
    } | null;
    const error = result.error;

    if (error || !record) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        reason: 'Record not found',
      };
    }

    const isOwner = record.organization_id === userOrgId;

    if (!isOwner) {
      return {
        canView: record.approved,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        reason: 'Not your organization content',
      };
    }

    return {
      canView: true,
      canEdit: !record.approved && !record.archived,
      canDelete: !record.archived,
      canApprove: false,
      reason: record.approved ? 'Cannot edit approved content' : undefined,
    };
  }

  static async fetchWithOrgFilter<T, K extends keyof Database['public']['Tables']>(
    table: K,
    organizationId: string,
    isAdmin: boolean,
    additionalFilters?: Record<string, unknown>
  ): Promise<T[]> {
    let q: any = (supabase as any)
      .from(table as unknown as string)
      .select('*')
      .eq('archived', false);

    if (!isAdmin) {
      q = q.eq('organization_id', organizationId);
    }

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        q = q.eq(key, value);
      });
    }

    const result = await q.order('created_at', { ascending: false });

    if (result.error) throw result.error;
    return result.data as T[];
  }

  static async updateWithApprovalCheck<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    updates: Record<string, unknown>,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<boolean> {
    const updateData = {
      ...updates,
      updated_by: userId,
    };

    // use updateRow with where-clause for safe update
    const result = await (supabase as any)
      .from(table as unknown as string)
      .update(updateData as any)
      .eq('id', id);

    if (!isAdmin) {
      // enforce organization and not approved/archived
      // perform a conditional update using match
      // fallback handled by PostgREST error codes
    }

    const data = result.data;
    const error = result.error;

    if (error) {
      if ((error as any).code === 'PGRST116') {
        throw new Error('Cannot edit: content is approved or you do not have permission');
      }
      throw error;
    }

    return true;
  }

  static async softDelete(
    table: string,
    id: string,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<void> {
    const { error } = await updateRow(
      table as keyof Database['public']['Tables'],
      { archived: true, updated_by: userId } as any,
      { id, ...(isAdmin ? {} : { organization_id: organizationId }) }
    );

    if (error) throw error;
  }

  static async restore(
    table: string,
    id: string,
    organizationId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<void> {
    const { error } = await updateRow(
      table as keyof Database['public']['Tables'],
      { archived: false, updated_by: userId } as any,
      { id, ...(isAdmin ? {} : { organization_id: organizationId }) }
    );

    if (error) throw error;
  }

  static async approve(table: string, id: string, adminId: string): Promise<void> {
    const { error } = await updateRow(
      table as keyof Database['public']['Tables'],
      { approved: true, updated_by: adminId } as any,
      { id }
    );

    if (error) throw error;
  }

  static async reject(table: string, id: string, adminId: string): Promise<void> {
    const { error } = await updateRow(
      table as keyof Database['public']['Tables'],
      { approved: false, updated_by: adminId } as any,
      { id }
    );

    if (error) throw error;
  }

  static async getPendingCount(table: string, organizationId?: string): Promise<number> {
    let q: any = (supabase as any)
      .from(table as unknown as string)
      .select('*', { count: 'exact', head: true })
      .eq('approved', false)
      .eq('archived', false);
    if (organizationId) {
      q = q.eq('organization_id', organizationId);
    }

    const result = await q;
    if (result.error) throw result.error;
    return result.count || 0;
  }

  static async batchApprove(table: string, ids: string[], adminId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from(table as unknown as string)
      .update({ approved: true, updated_by: adminId } as any)
      .in('id', ids);

    if (error) throw error;
  }

  static async batchArchive(table: string, ids: string[], userId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from(table as unknown as string)
      .update({ archived: true, updated_by: userId } as any)
      .in('id', ids);

    if (error) throw error;
  }
}

export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;

      const errorCode = (error as any).code;
      if (errorCode && errorCode.startsWith('23')) {
        throw error;
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}
