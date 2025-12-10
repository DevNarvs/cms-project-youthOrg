import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase, insertRow, updateRow } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export interface CreateOrgAccountData {
  organizationName: string;
  email: string;
  password: string;
  presidentName?: string;
  presidentEmail?: string;
  presidentPhone?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}

export interface OrgAccountResult {
  userId: string;
  organizationId: string;
  email: string;
}

export class AdminUserService {
  static ensureAdminClient() {
    if (!supabaseAdmin) {
      throw new Error('Admin client not configured. Service role key is missing.');
    }
    return supabaseAdmin;
  }

  static async createOrganizationAccount(
    data: CreateOrgAccountData,
    adminId: string
  ): Promise<OrgAccountResult> {
    const admin = this.ensureAdminClient();

    try {
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          role: 'organization',
          organization_name: data.organizationName,
        },
      });

      if (authError || !authUser.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`);
      }

      const orgInsert = await (supabase as any)
        .from('organizations')
        .insert({
          name: data.organizationName,
          created_by: adminId,
        })
        .select()
        .single();

      const organization = orgInsert.data as
        | Database['public']['Tables']['organizations']['Row']
        | null;

      if (!organization || orgInsert.error) {
        await admin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create organization: ${orgInsert.error?.message}`);
      }

      const { error: appUserError } = await insertRow('app_users', {
        id: authUser.user.id,
        email: data.email,
        full_name: data.email.split('@')[0],
        role: 'organization',
        organization_id: organization.id,
      } as Database['public']['Tables']['app_users']['Insert']);

      if (appUserError) {
        await admin.auth.admin.deleteUser(authUser.user.id);
        await supabase.from('organizations').delete().eq('id', organization.id);
        throw new Error(`Failed to create app user: ${appUserError.message}`);
      }

      return {
        userId: authUser.user.id,
        organizationId: organization.id,
        email: data.email,
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateOrganizationCredentials(
    organizationId: string,
    newEmail?: string,
    newPassword?: string
  ): Promise<void> {
    const admin = this.ensureAdminClient();

    const appUserResult = await (supabase as any)
      .from('app_users')
      .select('id, email')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .maybeSingle();

    const appUser = appUserResult.data as { id: string; email?: string } | null;

    if (appUserResult.error || !appUser) {
      throw new Error('Organization account not found');
    }

    const updateData: any = {};
    if (newEmail) updateData.email = newEmail;
    if (newPassword) updateData.password = newPassword;

    if (Object.keys(updateData).length === 0) {
      return;
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(appUser.id, updateData);

    if (updateError) {
      throw new Error(`Failed to update credentials: ${updateError.message}`);
    }

    if (newEmail) {
      await updateRow(
        'app_users',
        { email: newEmail } as Database['public']['Tables']['app_users']['Update'],
        { id: appUser.id }
      );
    }
  }

  static async updatePresidentInfo(
    organizationId: string,
    presidentData: {
      name?: string;
    },
    adminId: string
  ): Promise<void> {
    const { error } = await updateRow(
      'organizations',
      {
        ...presidentData,
        updated_by: adminId,
      } as Database['public']['Tables']['organizations']['Update'],
      { id: organizationId }
    );

    if (error) {
      throw new Error(`Failed to update organization info: ${error.message}`);
    }
  }

  static async deactivateOrganizationAccount(organizationId: string): Promise<void> {
    const admin = this.ensureAdminClient();

    const appUserResult = await (supabase as any)
      .from('app_users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .maybeSingle();

    const appUser2 = appUserResult.data as { id: string } | null;

    if (appUser2) {
      await admin.auth.admin.updateUserById(appUser2.id, {
        ban_duration: 'none',
        user_metadata: { banned: true },
      });

      await updateRow(
        'app_users',
        { archived: true } as Database['public']['Tables']['app_users']['Update'],
        { id: appUser2.id }
      );
    }

    await updateRow(
      'organizations',
      { archived: true } as Database['public']['Tables']['organizations']['Update'],
      { id: organizationId }
    );
  }

  static async reactivateOrganizationAccount(organizationId: string): Promise<void> {
    const admin = this.ensureAdminClient();

    const appUserResult2 = await (supabase as any)
      .from('app_users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .maybeSingle();

    const appUser3 = appUserResult2.data as { id: string } | null;

    if (appUser3) {
      await admin.auth.admin.updateUserById(appUser3.id, {
        user_metadata: { banned: false },
      });

      await updateRow(
        'app_users',
        { archived: false } as Database['public']['Tables']['app_users']['Update'],
        { id: appUser3.id }
      );
    }

    await updateRow(
      'organizations',
      { archived: false } as Database['public']['Tables']['organizations']['Update'],
      { id: organizationId }
    );
  }

  static async deleteOrganizationAccount(organizationId: string): Promise<void> {
    const admin = this.ensureAdminClient();

    const appUserResult = await (supabase as any)
      .from('app_users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .maybeSingle();

    const appUser = appUserResult.data as { id: string } | null;

    if (appUser) {
      await admin.auth.admin.deleteUser(appUser.id);
    }

    await (supabase as any).from('organizations').delete().eq('id', organizationId);
  }

  static async resetOrganizationPassword(organizationId: string): Promise<string> {
    const admin = this.ensureAdminClient();

    const appUserResult4 = await (supabase as any)
      .from('app_users')
      .select('id, email')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .maybeSingle();

    const appUser4 = appUserResult4.data as { id: string; email?: string } | null;

    if (!appUser4) {
      throw new Error('Organization account not found');
    }

    const tempPassword = this.generateTemporaryPassword();

    const { error } = await admin.auth.admin.updateUserById(appUser4.id, {
      password: tempPassword,
    });

    if (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }

    return tempPassword;
  }

  static async createAdminAccount(email: string, password: string): Promise<OrgAccountResult> {
    const admin = this.ensureAdminClient();

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
      },
    });

    if (authError || !authUser.user) {
      throw new Error(`Failed to create admin user: ${authError?.message}`);
    }

    const { error: appUserError } = await supabase.from('app_users').insert({
      id: authUser.user.id,
      email,
      full_name: email.split('@')[0],
      role: 'admin',
      organization_id: null,
    } as any);

    if (appUserError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create admin app user: ${appUserError.message}`);
    }

    return {
      userId: authUser.user.id,
      organizationId: '',
      email,
    };
  }

  private static generateTemporaryPassword(): string {
    const length = 12;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const all = lowercase + uppercase + numbers + special;

    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
