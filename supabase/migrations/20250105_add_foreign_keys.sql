-- Add foreign key constraint from show_states to contestants
-- This must be done after both tables exist to avoid circular dependency
ALTER TABLE show_states
ADD CONSTRAINT fk_show_states_contestant
FOREIGN KEY (current_contestant_id) REFERENCES contestants(id) ON DELETE SET NULL;

-- Add foreign key constraint from performance_queue to contestants for stage_name consistency
-- This ensures the user_id in performance_queue matches a valid contestant
ALTER TABLE performance_queue
ADD CONSTRAINT fk_performance_queue_contestant
FOREIGN KEY (user_id) REFERENCES contestants(user_id) ON DELETE CASCADE;