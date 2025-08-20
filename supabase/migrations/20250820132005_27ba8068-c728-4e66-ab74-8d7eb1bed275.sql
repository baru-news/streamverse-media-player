-- Update RLS policies untuk memungkinkan anonymous users melihat badge di komentar

-- Policy untuk user_badges: allow anonymous users to view active badges
CREATE POLICY "Anyone can view active user badges for display" 
ON user_badges 
FOR SELECT 
USING (is_active = true);

-- Policy untuk badge_store: ensure anonymous can view active badges (already exists but let's make sure)
DROP POLICY IF EXISTS "Anyone can view active badges" ON badge_store;

CREATE POLICY "Anyone can view active badges" 
ON badge_store 
FOR SELECT 
USING (is_active = true);