import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_MAITALENT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_MAITALENT_SUPABASE_ANON_KEY;

// DEBUG: Log actual environment variable values
console.log('=== SUPABASE CONFIG DEBUG ===');
console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseUrl is undefined:', supabaseUrl === undefined);
console.log('supabaseUrl is null:', supabaseUrl === null);
console.log('supabaseUrl length:', supabaseUrl ? supabaseUrl.length : 'N/A');
console.log('supabaseAnonKey:', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'undefined/null');
console.log('supabaseAnonKey is undefined:', supabaseAnonKey === undefined);
console.log('supabaseAnonKey is null:', supabaseAnonKey === null);
console.log('supabaseAnonKey length:', supabaseAnonKey ? supabaseAnonKey.length : 'N/A');

// Check for missing environment variables
const missingKeys: string[] = [];
if (!supabaseUrl) missingKeys.push('VITE_MAITALENT_SUPABASE_URL');
if (!supabaseAnonKey) missingKeys.push('VITE_MAITALENT_SUPABASE_ANON_KEY');

// Export missing keys for use in error handling
export const MISSING_ENV_KEYS = missingKeys;

if (missingKeys.length > 0) {
  console.warn('Missing Supabase environment variables:', missingKeys);
  console.warn('Available VITE_ env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
} else {
  console.log('✅ Supabase environment variables loaded successfully');
}

const baseClient: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// DEBUG: Log client creation result
console.log('Supabase client created with URL:', supabaseUrl ? '✅' : '❌');
console.log('Supabase client created with key:', supabaseAnonKey ? '✅' : '❌');

type EntityValues = Record<string, unknown>;

type EntityClient<TValues extends EntityValues = EntityValues> = {
  list: (orderBy?: string, limit?: number) => Promise<any[]>;
  filter: (filters: Record<string, unknown>) => Promise<any[]>;
  create: (values: TValues) => Promise<any>;
  update: (id: string, values: Partial<TValues>) => Promise<any>;
};

type SupabaseExtended = SupabaseClient & {
  auth: SupabaseClient['auth'] & {
    me: () => Promise<any>;
    updateMe: (values: Record<string, unknown>) => Promise<void>;
    logout: (redirectTo?: string) => Promise<void>;
    redirectToLogin: () => void;
  };
  entities: {
    Contestant: EntityClient;
    Judge: EntityClient;
    Message: EntityClient;
    CoinPackage: EntityClient;
    ChatMessage: EntityClient;
    Championship: EntityClient;
    ShowState: EntityClient;
    Gift: EntityClient;
  };
  integrations: {
    Core: {
      UploadFile: ({ file }: { file: File }) => Promise<{ file_url: string }>;
    };
  };
};

const supabaseExtended = baseClient as SupabaseExtended;

supabaseExtended.auth.me = async () => {
  const { data, error } = await baseClient.auth.getUser();
  if (error || !data.user) {
    throw error || new Error('Not authenticated');
  }
  const { data: profile, error: profileError } = await baseClient
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileError) {
    throw profileError;
  }
  return profile;
};

supabaseExtended.auth.updateMe = async (values: Record<string, unknown>) => {
  const { data, error } = await baseClient.auth.getUser();
  if (error || !data.user) {
    throw error || new Error('Not authenticated');
  }
  const { error: updateError } = await baseClient
    .from('users')
    .update(values)
    .eq('id', data.user.id);
  if (updateError) {
    throw updateError;
  }
};

supabaseExtended.auth.logout = async (redirectTo?: string) => {
  await baseClient.auth.signOut();
  if (redirectTo) {
    window.location.href = redirectTo;
  }
};

supabaseExtended.auth.redirectToLogin = () => {
  window.location.href = '/auth';
};

const createEntityClient = (table: string): EntityClient => ({
  list: async (orderBy?: string, limit?: number) => {
    let query = baseClient.from(table).select('*');
    if (orderBy) {
      const descending = orderBy.startsWith('-');
      const column = descending ? orderBy.slice(1) : orderBy;
      query = query.order(column, { ascending: !descending });
    }
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data;
  },
  filter: async (filters: Record<string, unknown>) => {
    let query = baseClient.from(table).select('*');
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value as never);
    });
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data;
  },
  create: async (values: EntityValues) => {
    const { data, error } = await baseClient
      .from(table)
      .insert(values)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data;
  },
  update: async (id: string, values: Partial<EntityValues>) => {
    const { data, error } = await baseClient
      .from(table)
      .update(values)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data;
  }
});

supabaseExtended.entities = {
  Contestant: createEntityClient('contestants'),
  Judge: createEntityClient('judges'),
  Message: createEntityClient('messages'),
  CoinPackage: createEntityClient('coin_packages'),
  ChatMessage: createEntityClient('chat_messages'),
  Championship: createEntityClient('championships'),
  ShowState: createEntityClient('show_states'),
  Gift: createEntityClient('gifts')
};

supabaseExtended.integrations = {
  Core: {
    UploadFile: async ({ file }: { file: File }) => {
      const filePath = `${Date.now()}-${file.name}`;
      
      // Try to upload to user-uploads bucket first
      let { data, error } = await baseClient.storage
        .from('user-uploads')
        .upload(filePath, file);
      
      // If bucket doesn't exist, try default bucket
      if (error?.message?.includes('bucket not found') || error?.message?.includes('user-uploads')) {
        ({ data, error } = await baseClient.storage
          .from('avatars')
          .upload(filePath, file));
      }
      
      // If still fails, try creating the bucket first
      if (error) {
        try {
          await baseClient.storage.createBucket('user-uploads', {
            public: true,
            fileSizeLimit: 5242880, // 5MB limit
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          });
          
          ({ data, error } = await baseClient.storage
            .from('user-uploads')
            .upload(filePath, file));
        } catch (createError) {
          // Fallback to default bucket if bucket creation fails
          ({ data, error } = await baseClient.storage
            .from('avatars')
            .upload(filePath, file));
        }
      }
      
      if (error || !data) {
        throw error || new Error('Upload failed: Unable to upload file to any available storage bucket.');
      }
      
      const { data: publicUrlData } = baseClient.storage
        .from('user-uploads')
        .getPublicUrl(data.path);
      return { file_url: publicUrlData.publicUrl };
    }
  }
};

export const supabase = supabaseExtended;
