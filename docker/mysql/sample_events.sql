-- Beispiel-Events für vapurserdar@gmail.com

-- Event 1: Türkisches Sommerfest 2026
INSERT INTO events (organizer_id, slug, affiliate_url, is_promoted, hero_video_path, image_path, created_at) 
VALUES (1, 'tuerkisches-sommerfest-2026', 'https://eventbrite.com/tickets', 1, NULL, '/uploads/events/sample1.jpg', NOW());

SET @event1_id = LAST_INSERT_ID();

INSERT INTO event_translations (event_id, language, title, description, location_name) 
VALUES (@event1_id, 'de', 'Türkisches Sommerfest 2026', 'Ein großartiges Fest mit türkischer Musik, Tanz und kulinarischen Köstlichkeiten. Erleben Sie die türkische Kultur hautnah!', 'Tempelhofer Feld, Berlin');

INSERT INTO event_occurrences (event_id, start_datetime, end_datetime, is_cancelled) 
VALUES (@event1_id, '2026-07-15 14:00:00', '2026-07-15 23:00:00', 0);

INSERT INTO event_communities (event_id, community_id) VALUES (@event1_id, 1);
INSERT INTO event_categories (event_id, category_id) VALUES (@event1_id, 2);

-- Event 2: Griechischer Abend
INSERT INTO events (organizer_id, slug, affiliate_url, is_promoted, hero_video_path, image_path, created_at) 
VALUES (1, 'griechischer-abend-berlin', 'https://tickets.de/greek-night', 0, NULL, '/uploads/events/sample2.jpg', NOW());

SET @event2_id = LAST_INSERT_ID();

INSERT INTO event_translations (event_id, language, title, description, location_name) 
VALUES (@event2_id, 'de', 'Griechischer Abend', 'Genießen Sie einen unvergesslichen Abend mit griechischer Live-Musik, traditionellen Tänzen und authentischem Essen.', 'Kulturzentrum Kreuzberg, Berlin');

INSERT INTO event_occurrences (event_id, start_datetime, end_datetime, is_cancelled) 
VALUES (@event2_id, '2026-06-20 19:00:00', '2026-06-21 02:00:00', 0);

INSERT INTO event_communities (event_id, community_id) VALUES (@event2_id, 2);
INSERT INTO event_categories (event_id, category_id) VALUES (@event2_id, 3);

-- Event 3: Multikulturelles Konzert
INSERT INTO events (organizer_id, slug, affiliate_url, is_promoted, hero_video_path, image_path, created_at) 
VALUES (1, 'multikulturelles-konzert-2026', NULL, 1, NULL, '/uploads/events/sample3.jpg', NOW());

SET @event3_id = LAST_INSERT_ID();

INSERT INTO event_translations (event_id, language, title, description, location_name) 
VALUES (@event3_id, 'de', 'Multikulturelles Konzert', 'Ein einzigartiges Konzert mit Künstlern aus verschiedenen Kulturen. Erleben Sie musikalische Vielfalt!', 'Columbiahalle, Berlin');

INSERT INTO event_occurrences (event_id, start_datetime, end_datetime, is_cancelled) 
VALUES (@event3_id, '2026-08-10 20:00:00', '2026-08-10 23:30:00', 0);

INSERT INTO event_communities (event_id, community_id) VALUES (@event3_id, 1);
INSERT INTO event_communities (event_id, community_id) VALUES (@event3_id, 2);
INSERT INTO event_communities (event_id, community_id) VALUES (@event3_id, 3);
INSERT INTO event_categories (event_id, category_id) VALUES (@event3_id, 1);

-- Event 4: Türkischer Film-Abend
INSERT INTO events (organizer_id, slug, affiliate_url, is_promoted, hero_video_path, image_path, created_at) 
VALUES (1, 'tuerkischer-film-abend', 'https://kino-tickets.de/turkish-cinema', 0, NULL, '/uploads/events/sample4.jpg', NOW());

SET @event4_id = LAST_INSERT_ID();

INSERT INTO event_translations (event_id, language, title, description, location_name) 
VALUES (@event4_id, 'de', 'Türkischer Film-Abend', 'Klassische und moderne türkische Filme mit deutscher Untertitelung. Ein kulturelles Kinoerlebnis!', 'Babylon Kino, Berlin');

INSERT INTO event_occurrences (event_id, start_datetime, end_datetime, is_cancelled) 
VALUES (@event4_id, '2026-05-25 18:00:00', '2026-05-25 22:00:00', 0);

INSERT INTO event_communities (event_id, community_id) VALUES (@event4_id, 1);
INSERT INTO event_categories (event_id, category_id) VALUES (@event4_id, 4);

-- Event 5: Internationales Street Food Festival
INSERT INTO events (organizer_id, slug, affiliate_url, is_promoted, hero_video_path, image_path, created_at) 
VALUES (1, 'street-food-festival-berlin-2026', 'https://streetfood-berlin.de/tickets', 1, NULL, '/uploads/events/sample5.jpg', NOW());

SET @event5_id = LAST_INSERT_ID();

INSERT INTO event_translations (event_id, language, title, description, location_name) 
VALUES (@event5_id, 'de', 'Internationales Street Food Festival', 'Entdecken Sie kulinarische Köstlichkeiten aus aller Welt! Über 50 Food-Stände mit türkischen, griechischen und internationalen Spezialitäten.', 'Mauerpark, Berlin');

INSERT INTO event_occurrences (event_id, start_datetime, end_datetime, is_cancelled) 
VALUES (@event5_id, '2026-09-05 12:00:00', '2026-09-05 22:00:00', 0),
       (@event5_id, '2026-09-06 12:00:00', '2026-09-06 22:00:00', 0);

INSERT INTO event_communities (event_id, community_id) VALUES (@event5_id, 1);
INSERT INTO event_communities (event_id, community_id) VALUES (@event5_id, 2);
INSERT INTO event_communities (event_id, community_id) VALUES (@event5_id, 3);
INSERT INTO event_categories (event_id, category_id) VALUES (@event5_id, 2);
