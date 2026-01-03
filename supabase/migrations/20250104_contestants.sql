-- Create contestants table
CREATE TABLE contestants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    avatar_url TEXT NULL,
    bio TEXT NULL,
    talent_type TEXT NOT NULL,
    total_score INTEGER DEFAULT 0,
    performance_count INTEGER DEFAULT 0,
    championship_position INTEGER NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for contestants table
ALTER PUBLICATION supabase_realtime ADD TABLE contestants;

-- Create indexes for performance
CREATE INDEX idx_contestants_user_id ON contestants(user_id);
CREATE INDEX idx_contestants_email ON contestants(email);
CREATE INDEX idx_contestants_talent_type ON contestants(talent_type);
CREATE INDEX idx_contestants_total_score ON contestants(total_score);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contestants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_contestants_updated_at
    BEFORE UPDATE ON contestants
    FOR EACH ROW
    EXECUTE FUNCTION update_contestants_updated_at();
