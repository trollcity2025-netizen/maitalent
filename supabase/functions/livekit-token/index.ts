import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.10.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    let authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
    if (authHeader && !authHeader.startsWith("Bearer ")) {
      authHeader = `Bearer ${authHeader}`;
    }
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: "Missing authorization header"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY in Edge Function secrets"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data?.user) {
      return new Response(JSON.stringify({
        error: "Invalid token / Not authenticated",
        details: userError?.message ?? "No user returned"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const user = data.user;
    const { roomName, canPublish, canSubscribe } = await req.json();
    if (!roomName) {
      return new Response(JSON.stringify({
        error: "roomName is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY");
    const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("LIVEKIT_URL");
    if (!livekitApiKey || !livekitApiSecret || !livekitUrl) {
      return new Response(JSON.stringify({
        error: "Missing LiveKit configuration. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL environment variables."
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Map room type to actual room name
    const actualRoomName = getRoomName(roomName);
    // Generate LiveKit token using the SDK
    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: user.id,
      name: user.user_metadata?.full_name || user.email || user.id,
      ttl: "1h"
    });
    // Add room grant for access
    at.addGrant({
      roomJoin: true,
      room: actualRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });
    // Generate the JWT token
    let token;
    try {
      token = at.toJwt();
      console.log("LiveKit token generated successfully");
      console.log("Token type:", typeof token);
      console.log("Token length:", token ? token.length : 0);
      // Validate token format (should be a JWT with 3 parts)
      if (typeof token === 'string' && token.split('.').length === 3) {
        console.log("Token format is valid JWT");
      } else {
        console.log("Token format is invalid:", token);
        throw new Error("Generated token is not a valid JWT format");
      }
    } catch (tokenError) {
      console.error("Error generating LiveKit token:", tokenError);
      const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
      throw new Error(`Failed to generate LiveKit token: ${errorMessage}`);
    }
    return new Response(JSON.stringify({
      token: token,
      livekitUrl: livekitUrl
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
/**
 * Map room type to actual room name
 * @param {string} roomType - The type of room (audition or main_show)
 * @returns {string} The actual room name
 */ function getRoomName(roomType) {
  switch(roomType){
    case "audition":
      return "audition-room";
    case "main_show":
      return "main-show";
    default:
      throw new Error(`Invalid roomType: ${roomType}. Must be 'audition' or 'main_show'`);
  }
}
