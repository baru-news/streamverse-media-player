-- Fix banner ad position issue
UPDATE ads 
SET position = 'banner', updated_at = now()
WHERE id = '5088dc4c-55c8-4e4a-885f-43544bb94288' AND position = 'content';