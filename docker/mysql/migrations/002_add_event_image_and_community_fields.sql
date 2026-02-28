-- Migration: Event-Bild und Community-Felder hinzufügen

-- Events: image_path hinzufügen
ALTER TABLE events 
ADD COLUMN image_path VARCHAR(255) AFTER hero_video_path;

-- Communities: flag_icon und preview_image hinzufügen
ALTER TABLE communities 
ADD COLUMN flag_icon VARCHAR(10) AFTER slug,
ADD COLUMN preview_image VARCHAR(255) AFTER flag_icon;
