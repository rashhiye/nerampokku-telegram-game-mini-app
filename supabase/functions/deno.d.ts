// ==============================================================================
// Ambient types for Supabase Edge Functions (Deno runtime)
// Resolves VS Code / TypeScript editor types for Deno and remote URL imports
// ==============================================================================

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    has(key: string): boolean;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }
  export const env: Env;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export type Handler = (request: Request) => Response | Promise<Response>;
  export interface ServeInit {
    port?: number;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
  }
  export function serve(handler: Handler, init?: ServeInit): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.49.1" {
  export * from "@supabase/supabase-js";
}

declare module "https://*" {
  const content: any;
  export default content;
  export const serve: any;
  export const createClient: any;
  export const validateTelegramInitData: any;
}
