-- Create show_states table
CREATE TABLE show_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_live BOOLEAN DEFAULT FALSE,
    current_contestant_id UUID NULL,
    show_title TEXT NULL,
    curtains_open BOOLEAN DEFAULT FALSE,
    performance_end_time TIMESTAMP WITH TIME ZONE NULL,
    viewer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for show_states table
ALTER PUBLICATION supabase_realtime ADD TABLE show_states;

-- Create index for performance
CREATE INDEX idx_show_states_is_live ON show_states(is_live);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_show_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_show_states_updated_at
    BEFORE UPDATE ON show_states
    FOR EACH ROW
    EXECUTE FUNCTION update_show_states_updated_at();

-- Insert initial show state
INSERT INTO show_states (is_live, curtains_open, viewer_count)
VALUES (FALSE, FALSE, 0)
ON CONFLICT DO NOTHING;