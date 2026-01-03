import { createClient } from '@supabase/supabase-js';

async function getValidToken() {
  const supabaseUrl = 'https://toguqsixflnbitxxbngi.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZ3Vxc2l4ZmxuYml0eHhuZ2kiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2NzQwNzY5MSwiZXhwIjoyMDgzOTg0MDkxfQ.0000000000000000000000000000000000000000000';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Try to sign in with email and password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123'
  });
  
  if (error) {
    console.error('Login error:', error.message);
    return null;
  }
  
  return data.session?.access_token;
}

async function testLiveKitToken() {
  try {
    const jwtToken = await getValidToken();
    
    if (!jwtToken) {
      console.log('Could not get a valid JWT token');
      return;
    }
    
    console.log('Using JWT token:', jwtToken.substring(0, 50) + '...');
    
    const response = await fetch('https://toguqsixflnbitxxbngi.supabase.co/functions/v1/livekit-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        roomName: 'main_show',
        canPublish: true,
        canSubscribe: true
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (result.token) {
      console.log('Token length:', result.token.length);
      console.log('Token format check:', result.token.split('.').length === 3 ? 'Valid JWT' : 'Invalid JWT');
    }

  } catch (error) {
    console.error('Error testing LiveKit token:', error);
  }
}

testLiveKitToken();