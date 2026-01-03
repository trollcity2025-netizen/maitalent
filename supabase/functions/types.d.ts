// Type declarations for remote modules and Deno globals
// This file provides TypeScript support for the Supabase Edge Function

// Deno global declarations
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

// HTTP server types from std/http/server
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export interface Request {
    method: string;
    headers: Headers;
    json(): Promise<any>;
  }

  export interface Response {
    new(body?: BodyInit | null, init?: ResponseInit): Response;
  }

  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

// Supabase client types
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClient {
    auth: {
      getUser(): Promise<{ data: { user: any } | null; error: any }>;
    };
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): SupabaseClient;
}

// LiveKit server SDK types
declare module "https://esm.sh/livekit-server-sdk@2.6.0" {
  export class AccessToken {
    constructor(apiKey: string, apiSecret: string, options?: any);
    addGrant(grant: any): void;
    toJwt(): string;
  }
}

// Global fetch function
declare function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;

// Extend global Response type to match Deno's Response
declare global {
  interface Response extends globalThis.Response {}
}