#!/bin/bash

# LiveKit Token Edge Function Deployment Script

echo "🚀 Deploying LiveKit Token Edge Function..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if we're logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged into Vercel. Please run:"
    echo "   vercel login"
    exit 1
fi

# Check for required environment variables
if [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
    echo "⚠️  Warning: LiveKit environment variables not set locally"
    echo "   Make sure to set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Vercel dashboard"
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🔗 Your function will be available at:"
echo "   https://your-project.vercel.app/api/livekit-token"
echo ""
echo "📝 Don't forget to set your LiveKit environment variables in Vercel dashboard if not already done."