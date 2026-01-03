-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create performance_queue table
CREATE TABLE performance_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('audition', 'main_show')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'called_up', 'ready', 'live', 'removed')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    called_at TIMESTAMP WITH TIME ZONE NULL,
    live_at TIMESTAMP WITH TIME ZONE NULL,
    -- Note: Using partial unique index instead of WHERE clause in UNIQUE constraint
    CONSTRAINT valid_status_transition CHECK (
        (status = 'queued' AND called_at IS NULL AND live_at IS NULL) OR
        (status = 'called_up' AND called_at IS NOT NULL AND live_at IS NULL) OR
        (status = 'ready' AND called_at IS NOT NULL AND live_at IS NULL) OR
        (status = 'live' AND called_at IS NOT NULL AND live_at IS NOT NULL) OR
        (status = 'removed' AND called_at IS NULL AND live_at IS NULL)
    )
);

-- Create stage_state table
CREATE TABLE stage_state (
    room_id TEXT PRIMARY KEY,
    room_type TEXT NOT NULL CHECK (room_type IN ('audition', 'main_show')),
    active_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    curtain_state TEXT NOT NULL DEFAULT 'closed' CHECK (curtain_state IN ('closed', 'opening', 'open', 'closing')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE performance_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE stage_state;

-- Create indexes for performance
CREATE INDEX idx_performance_queue_room_status ON performance_queue(room_id, status, joined_at);
CREATE INDEX idx_performance_queue_user_room ON performance_queue(user_id, room_type);
CREATE INDEX idx_stage_state_room_type ON stage_state(room_type);

-- Create partial unique index for user_id, room_type, status (excluding 'removed')
CREATE UNIQUE INDEX idx_performance_queue_user_room_status_active
ON performance_queue(user_id, room_type, status)
WHERE status != 'removed';

-- Create function to validate single active contestant per room
CREATE OR REPLACE FUNCTION validate_single_active_contestant()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's already an active contestant in this room
    IF NEW.status = 'live' THEN
        IF EXISTS (
            SELECT 1 FROM stage_state 
            WHERE room_id = NEW.room_id 
            AND active_user_id IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Stage currently occupied. Cannot start performance.';
        END IF;
        
        -- Update stage state to set this contestant as active
        UPDATE stage_state 
        SET active_user_id = NEW.user_id, 
            curtain_state = 'open',
            updated_at = NOW()
        WHERE room_id = NEW.room_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for live status validation
CREATE TRIGGER trigger_validate_single_active_contestant
    BEFORE UPDATE ON performance_queue
    FOR EACH ROW
    EXECUTE FUNCTION validate_single_active_contestant();

-- Create function to handle queue cleanup on stage state changes
CREATE OR REPLACE FUNCTION cleanup_stage_state()
RETURNS TRIGGER AS $$
BEGIN
    -- If stage becomes empty, mark any live contestants as removed
    IF OLD.active_user_id IS NOT NULL AND NEW.active_user_id IS NULL THEN
        UPDATE performance_queue 
        SET status = 'removed', 
            live_at = NULL
        WHERE user_id = OLD.active_user_id 
        AND status = 'live';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage state cleanup
CREATE TRIGGER trigger_cleanup_stage_state
    AFTER UPDATE ON stage_state
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_stage_state();

-- Insert initial stage states for both rooms
INSERT INTO stage_state (room_id, room_type, active_user_id, curtain_state)
VALUES 
    ('audition-room', 'audition', NULL, 'closed'),
    ('main-show', 'main_show', NULL, 'closed')
ON CONFLICT (room_id) DO NOTHING;