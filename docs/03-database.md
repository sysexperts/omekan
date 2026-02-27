# Datenbank-Schema (MySQL 8)

## users
- id
- name
- email
- password_hash
- role (admin | organizer)
- created_at

## organizers
- id
- user_id
- display_name
- website
- is_partner
- token_balance

## artists
- id
- name
- spotify_id
- image_path
- description

## artist_reviews
- id
- artist_id
- user_id
- rating (1–5)
- comment
- is_approved
- created_at

## events
- id
- organizer_id
- slug
- affiliate_url
- is_promoted
- hero_video_path
- created_at

## event_translations
- id
- event_id
- language (de, tr, el)
- title
- description
- location_name

## event_occurrences
- id
- event_id
- start_datetime
- end_datetime
- is_cancelled

## event_artists
- event_id
- artist_id

## communities
- id
- name
- slug
- is_active

## categories
- id
- name
- slug

## event_communities
- event_id
- community_id

## event_categories
- event_id
- category_id

## REGELN
- KEINE Spalten löschen
- Neue Features = neue Tabellen
- Keine Logik in der DB