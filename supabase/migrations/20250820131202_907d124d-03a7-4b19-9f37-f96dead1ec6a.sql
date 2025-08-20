-- Add foreign key constraint dari user_coins ke profiles
ALTER TABLE user_coins 
ADD CONSTRAINT user_coins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;