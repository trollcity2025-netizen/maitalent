import express from 'express';
import { createServer } from 'node:http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { createLiveKitToken } from './src/lib/livekit.js';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-supabase-auth']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Authentication middleware
const authenticateSupabaseUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Supabase server-side API endpoints
app.get('/api/profile', authenticateSupabaseUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', authenticateSupabaseUser, async (req, res) => {
  try {
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Contestant management endpoints
app.get('/api/contestants', authenticateSupabaseUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contestants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching contestants:', error);
    res.status(500).json({ error: 'Failed to fetch contestants' });
  }
});

app.post('/api/contestants', authenticateSupabaseUser, async (req, res) => {
  try {
    const contestantData = {
      ...req.body,
      user_id: req.user.id,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('contestants')
      .insert([contestantData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating contestant:', error);
    res.status(500).json({ error: 'Failed to create contestant' });
  }
});

// Queue management endpoints
app.get('/api/queue', authenticateSupabaseUser, async (req, res) => {
  try {
    const { roomType } = req.query;
    
    if (!roomType) {
      return res.status(400).json({ error: 'Missing roomType parameter' });
    }
    
    const { data, error } = await supabase
      .from('performance_queue')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('room_type', roomType)
      .eq('status', 'queued')
      .order('joined_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

app.post('/api/queue/call-up', authenticateSupabaseUser, async (req, res) => {
  try {
    const { userId, roomType } = req.body;
    
    if (!userId || !roomType) {
      return res.status(400).json({ error: 'Missing userId or roomType' });
    }
    
    // Update status to called_up
    const { data, error } = await supabase
      .from('performance_queue')
      .update({
        status: 'called_up',
        called_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('room_type', roomType)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error calling up contestant:', error);
    res.status(500).json({ error: 'Failed to call up contestant' });
  }
});

app.post('/api/queue/ready', authenticateSupabaseUser, async (req, res) => {
  try {
    const { userId, roomType } = req.body;
    
    if (!userId || !roomType) {
      return res.status(400).json({ error: 'Missing userId or roomType' });
    }
    
    // Update status to ready
    const { data, error } = await supabase
      .from('performance_queue')
      .update({ status: 'ready' })
      .eq('user_id', userId)
      .eq('room_type', roomType)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error marking contestant as ready:', error);
    res.status(500).json({ error: 'Failed to mark contestant as ready' });
  }
});

app.post('/api/queue/remove', authenticateSupabaseUser, async (req, res) => {
  try {
    const { userId, roomType } = req.body;
    
    if (!userId || !roomType) {
      return res.status(400).json({ error: 'Missing userId or roomType' });
    }
    
    // Update status to removed
    const { data, error } = await supabase
      .from('performance_queue')
      .update({
        status: 'removed',
        called_at: null,
        live_at: null
      })
      .eq('user_id', userId)
      .eq('room_type', roomType)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error removing contestant from queue:', error);
    res.status(500).json({ error: 'Failed to remove contestant from queue' });
  }
});

// LiveKit token endpoint (authenticated)
app.post('/api/livekit-token', authenticateSupabaseUser, async (req, res) => {
  try {
    const { roomType, userName } = req.body;
    
    if (!roomType || !userName) {
      return res.status(400).json({ error: 'Missing required parameters: roomType and userName are required' });
    }
    
    // Validate roomType
    if (roomType !== 'audition' && roomType !== 'main_show') {
      return res.status(400).json({ error: 'Invalid roomType. Must be "audition" or "main_show"' });
    }
    
    const token = await createLiveKitToken(
      roomType === 'audition' ? 'audition-room' : 'main-show',
      req.user.id,
      userName
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: error.message || 'Failed to generate token' });
  }
});

// LiveKit token endpoint (public fallback)
app.post('/api/livekit-token-public', async (req, res) => {
  try {
    const { roomType, userName } = req.body;
    
    if (!roomType || !userName) {
      return res.status(400).json({ error: 'Missing required parameters: roomType and userName are required' });
    }
    
    // Validate roomType
    if (roomType !== 'audition' && roomType !== 'main_show') {
      return res.status(400).json({ error: 'Invalid roomType. Must be "audition" or "main_show"' });
    }
    
    const token = await createLiveKitToken(
      roomType === 'audition' ? 'audition-room' : 'main-show',
      'public-user',
      userName
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: error.message || 'Failed to generate token' });
  }
});

// Admin endpoints (require admin role)
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    if (error || !profile) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Admin endpoints
app.get('/api/admin/contestants', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contestants')
      .select(`
        *,
        users (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching admin contestants:', error);
    res.status(500).json({ error: 'Failed to fetch contestants' });
  }
});

app.post('/api/admin/queue/call-up', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { userId, roomType } = req.body;
    
    if (!userId || !roomType) {
      return res.status(400).json({ error: 'Missing userId or roomType' });
    }
    
    // Update status to called_up
    const { data, error } = await supabase
      .from('performance_queue')
      .update({
        status: 'called_up',
        called_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('room_type', roomType)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      contestant: data
    });
  } catch (error) {
    console.error('Error calling up contestant:', error);
    res.status(500).json({ error: 'Failed to call up contestant' });
  }
});

app.post('/api/admin/queue/ready', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { userId, roomType } = req.body;
    
    if (!userId || !roomType) {
      return res.status(400).json({ error: 'Missing userId or roomType' });
    }
    
    // Update status to ready
    const { data, error } = await supabase
      .from('performance_queue')
      .update({ status: 'ready' })
      .eq('user_id', userId)
      .eq('room_type', roomType)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      contestant: data
    });
  } catch (error) {
    console.error('Error marking contestant as ready:', error);
    res.status(500).json({ error: 'Failed to mark contestant as ready' });
  }
});

app.post('/api/admin/queue/start-performance', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { userId, roomType } = req.body;
    
    if (!userId || !roomType) {
      return res.status(400).json({ error: 'Missing userId or roomType' });
    }
    
    // Update status to live
    const { data, error } = await supabase
      .from('performance_queue')
      .update({
        status: 'live',
        live_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('room_type', roomType)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      contestant: data
    });
  } catch (error) {
    console.error('Error starting performance:', error);
    res.status(500).json({ error: 'Failed to start performance' });
  }
});

app.post('/api/admin/show/start', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { showTitle } = req.body;
    
    // Update show state to start
    const { data, error } = await supabase
      .from('show_states')
      .update({
        is_live: true,
        curtains_open: true,
        show_title: showTitle || 'Live Show',
        performance_end_time: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes from now
      })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, showState: data });
  } catch (error) {
    console.error('Error starting show:', error);
    res.status(500).json({ error: 'Failed to start show' });
  }
});

app.post('/api/admin/show/end', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    // Update show state to end
    const { data, error } = await supabase
      .from('show_states')
      .update({
        is_live: false,
        curtains_open: false,
        current_contestant_id: null,
        performance_end_time: null
      })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, showState: data });
  } catch (error) {
    console.error('Error ending show:', error);
    res.status(500).json({ error: 'Failed to end show' });
  }
});

app.post('/api/admin/show/set-contestant', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { contestantId } = req.body;
    
    if (!contestantId) {
      return res.status(400).json({ error: 'Missing contestantId' });
    }
    
    // Update show state to set current contestant
    const { data, error } = await supabase
      .from('show_states')
      .update({
        current_contestant_id: contestantId
      })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, showState: data });
  } catch (error) {
    console.error('Error setting current contestant:', error);
    res.status(500).json({ error: 'Failed to set current contestant' });
  }
});

app.post('/api/admin/queue/end-performance', authenticateSupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { userId, roomType } = req.body;
    
    if (!userId || !roomType) {
      return res.status(400).json({ error: 'Missing userId or roomType' });
    }
    
    // Update status to removed
    const { data, error } = await supabase
      .from('performance_queue')
      .update({
        status: 'removed',
        called_at: null,
        live_at: null
      })
      .eq('user_id', userId)
      .eq('room_type', roomType)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, contestant: data });
  } catch (error) {
    console.error('Error ending performance:', error);
    res.status(500).json({ error: 'Failed to end performance' });
  }
});

// Public endpoints (no authentication required)
app.get('/api/public/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contestants')
      .select(`
        id,
        name,
        avatar_url,
        total_score,
        performance_count
      `)
      .order('total_score', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/public/show-state', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('show_states')
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching show state:', error);
    res.status(500).json({ error: 'Failed to fetch show state' });
  }
});

// Serve static files
app.use(express.static(join(__dirname, 'dist')));

// Serve index.html for all routes (SPA) - must be last route
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});