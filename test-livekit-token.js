import fetch from 'node-fetch';

async function testLiveKitToken() {
  try {
    // Replace with your actual Supabase JWT token
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZ3Vxc2l4ZmxuYml0eHhiTmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NzY4NzAsImV4cCI6MjA1MTQ1Mjg3MH0.6727000000000000000000000000000000000000000';
    
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