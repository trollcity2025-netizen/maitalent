import { supabase } from './supabaseClient';

export async function getLiveKitToken(roomType: 'audition' | 'main_show'): Promise<string> {
  try {
    // Get session from Supabase auth instead of localStorage
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.access_token) {
      throw new Error('No active session found. Please log in.');
    }
    
    // Use Supabase functions.invoke instead of direct API call
    const { data, error } = await supabase.functions.invoke("livekit-token", {
      body: {
        roomName: roomType,
        canPublish: true,
        canSubscribe: true,
      },
    });
    
    if (error) {
      throw new Error(`Failed to get LiveKit token: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Invalid response from LiveKit token function - no data');
    }
    
    // Debug: Log the exact response structure
    console.log('LiveKit token function response:', JSON.stringify(data, null, 2));
    
    if (!data?.token || typeof data.token !== "string") {
      console.error("Bad token response:", data);
      throw new Error('Invalid response format from LiveKit token function');
    }
    
    const finalToken = data.token;
    
    return finalToken;
  } catch (error) {
    console.error('Error fetching LiveKit token:', error);
    throw error;
  }
}

export async function callUpContestant(): Promise<{ user_id: string }> {
  // This would need to be implemented as a Supabase function
  // For now, throw an error to indicate this needs to be implemented
  throw new Error('callUpContestant function not yet implemented as Supabase function');
}

export async function endPerformance(): Promise<void> {
  // This would need to be implemented as a Supabase function
  // For now, throw an error to indicate this needs to be implemented
  throw new Error('endPerformance function not yet implemented as Supabase function');
}

// Remove the mock API object - only one getLiveKitToken function should exist