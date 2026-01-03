#!/bin/bash

# Supabase Edge Function Deployment Script

echo "🚀 Deploying LiveKit Token Edge Function to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g @supabase/supabase-cli"
    exit 1
fi

# Check if we're logged into Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Not logged into Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Check for required environment variables
if [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
    echo "⚠️  Warning: LiveKit environment variables not set locally"
    echo "   Make sure to set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Supabase dashboard"
fi

# Deploy to Supabase
echo "📦 Deploying to Supabase..."
supabase functions deploy livekit-token

echo "✅ Deployment complete!"
echo ""
echo "🔗 Your function will be available at:"
echo "   https://toguqsixflnbitxxbngi.supabase.co/functions/v1/livekit-token"
echo ""
echo "📝 Don't forget to set your LiveKit environment variables in Supabase dashboard if not already done."
echo ""
echo "🔧 To set environment variables in Supabase:"
echo "   supabase functions secrets set LIVEKIT_API_KEY=your_api_key"
echo "   supabase functions secrets set LIVEKIT_API_SECRET=your_api_secret"