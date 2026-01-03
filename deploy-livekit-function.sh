#!/bin/bash

# LiveKit Token Function Deployment Script
# This script deploys the livekit-token function to Supabase

echo "🚀 Deploying LiveKit Token Function to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g @supabase/supabase
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this script from your project root."
    exit 1
fi

# Deploy the function
echo "📦 Deploying livekit-token function..."
supabase functions deploy livekit-token --project-ref toguqsixflnbitxxbngi

if [ $? -eq 0 ]; then
    echo "✅ LiveKit Token Function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set the following environment variables in your Supabase project:"
    echo "   - LIVEKIT_API_KEY"
    echo "   - LIVEKIT_API_SECRET" 
    echo "   - LIVEKIT_URL"
    echo ""
    echo "2. You can set these using:"
    echo "   supabase functions secrets set LIVEKIT_API_KEY=your_api_key"
    echo "   supabase functions secrets set LIVEKIT_API_SECRET=your_api_secret"
    echo "   supabase functions secrets set LIVEKIT_URL=your_livekit_url"
    echo ""
    echo "3. Test the function by calling it from your frontend application"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi