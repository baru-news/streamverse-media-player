-- Update the existing ad position from 'content' to 'banner' so it shows properly
UPDATE ads SET position = 'banner' WHERE position = 'content';