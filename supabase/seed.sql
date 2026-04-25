-- ────────────────────────────────────────────────────────────────────────────
-- stage-diary · seed entries (eungi's original 4 posts)
--
-- Usage:
--   1. Sign up via the app first so you have an auth user.
--   2. Find your auth user id in Supabase → Authentication → Users.
--   3. In Supabase SQL editor, replace the value of `:user_id_here` below
--      and run this entire script in one go.
--
--   The ":handle_here" you set will own /@<handle>/funkstyles-supernova etc.
-- ────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_user_id  uuid := ':user_id_here'::uuid;   -- ← REPLACE
  v_handle   text := 'eungi';                 -- ← REPLACE if you want a different handle
  v_display  text := 'eungi hong';
  v_bio      text := 'a small archive of the shows I''ve been lucky enough to be a part of — not a résumé, not a highlight reel.';
  v_entry_id uuid;
begin
  -- profile -----------------------------------------------------------------
  insert into public.profiles (id, handle, display_name, bio)
  values (v_user_id, v_handle, v_display, v_bio)
  on conflict (id) do update
    set handle = excluded.handle,
        display_name = excluded.display_name,
        bio = excluded.bio;

  -- 01 — funkstyles · supernova --------------------------------------------
  insert into public.entries (
    user_id, slug, title, title_html, eyebrow, medium, venue, performed_on,
    intro, pull_quote, video_caption, is_draft, sort_order
  ) values (
    v_user_id,
    'funkstyles-supernova',
    'funkstyles — supernova',
    '<em>supernova</em>,<br />or: first night<br />on the floor.',
    'dance · hip-hop · funkstyles',
    'dance',
    'University Cultural Centre',
    '2025-10-04',
    'The first time I stepped onto the UCC stage I could feel the bass before I heard it. We''d rehearsed this set until the choreography lived somewhere below thought, and still — the stage lights, the count-in, the silence between — felt like a new room I''d never stood in. This is what I remember of supernova.',
    'halfway through, I stopped counting and started listening, and that was the trick I''d been missing for months.',
    'full set · tk · link to come',
    false, 1
  )
  on conflict (user_id, slug) do update set updated_at = now()
  returning id into v_entry_id;

  delete from public.entry_sections where entry_id = v_entry_id;
  delete from public.entry_meta     where entry_id = v_entry_id;

  insert into public.entry_meta (entry_id, label, value, position) values
    (v_entry_id, 'date',  '04 oct 2025',                  0),
    (v_entry_id, 'venue', 'university cultural centre',   1),
    (v_entry_id, 'crew',  'nus funkstyles',               2),
    (v_entry_id, 'piece', 'group set — 4 min',            3);

  insert into public.entry_sections (entry_id, label, body, position) values
    (v_entry_id, 'i — the rehearsal',
     E'Funkstyles training weeks are equal parts discipline and argument: about musicality, about what a pocket is supposed to feel like, about whether the third eight-count is too cluttered. I came in thinking I knew my body. I left knowing I''d been lying.\n\nBy the final week, we were staying in the studio past midnight, running the last thirty seconds again and again until the floor was slick and we were all laughing too hard to dance. Some of the best moments of the whole year happened in that room, after hours, to nobody.',
     0),
    (v_entry_id, 'ii — the night',
     E'UCC is larger than it looks on paper. From the wings you can''t see the audience — only the glow, like the room is breathing. Our opening hit landed clean. I remember thinking, half a beat in: oh, we''re doing this.\n\nThere''s a freeze in the middle of the set that I''d messed up in every single run-through. Onstage, it held. I don''t know why. Bodies know things the mind hasn''t caught up to.',
     1),
    (v_entry_id, 'iii — what stayed',
     E'What I remember isn''t the performance itself — it''s the three seconds before we walked on. Someone squeezed my hand. Someone else said, "eat it up." I felt, for a moment, like I belonged to something that wasn''t mine alone.\n\nThis was the beginning of the year. I would spend the next six months trying to earn that feeling again.',
     2);

  -- 02 — fresh off the groove ----------------------------------------------
  insert into public.entries (
    user_id, slug, title, title_html, eyebrow, medium, venue, performed_on,
    intro, pull_quote, video_caption, is_draft, sort_order
  ) values (
    v_user_id,
    'funkstyles-fresh-off-the-groove',
    'Fresh Off The Groove (FOTG) vol. 2',
    '<em>fresh</em><br />off the<br />groove.',
    'dance · hip-hop · funkstyles annual',
    'dance',
    'Dance Atelier 2, NUS',
    '2026-03-21',
    'Fresh Off The Groove is our annual — the one we build the whole year toward. Six months of concept, costume, argument, and counting; two hours of stage time; the kind of show where you finish in the wings soaking wet and already miss it. I was in three sets this year. Here''s what happened.',
    'we spent all year building something we''d be done with in twelve minutes. that''s the whole deal, and it''s worth it every time.',
    'closer · full set · link tk',
    false, 2
  )
  on conflict (user_id, slug) do update set updated_at = now()
  returning id into v_entry_id;

  delete from public.entry_sections where entry_id = v_entry_id;
  delete from public.entry_meta     where entry_id = v_entry_id;

  insert into public.entry_meta (entry_id, label, value, position) values
    (v_entry_id, 'date',  '21 mar 2026',         0),
    (v_entry_id, 'venue', 'uc theatre · nus',    1),
    (v_entry_id, 'crew',  'nus funkstyles',      2),
    (v_entry_id, 'piece', 'full showcase — 3 sets', 3);

  insert into public.entry_sections (entry_id, label, body, position) values
    (v_entry_id, 'i — concept',
     E'The theme came from a voice note passed around in january — someone said the word *groove* wasn''t a sound, it was a gait. The whole showcase grew outward from that. We tried to make each set feel like a different way of walking through the same city.\n\nMy three sets landed in very different rooms: one was heavy, all weight and stomp. Another was a girls-set with sharp lines and no apology. The last was a closer, and I''d been waiting a year to be in a closer.',
     0),
    (v_entry_id, 'ii — the run',
     E'Tech rehearsal is always a mess. Lighting cues fall apart, someone''s mic feeds back, the floor is chalky. We ran the closer six times before the stage manager quietly called lunch. I ate rice in full costume and watched the juniors mark their eight-counts in the mirror.\n\nBy curtain, everything fell into place the way these things tend to — not because it was ready, but because there wasn''t time to be otherwise.',
     1),
    (v_entry_id, 'iii — the closer',
     E'The closer is different. You feel the audience behind the music now — they''ve been with you for two hours, and you owe them something. We hit the last drop and the house came up loud in a way I''ve only heard two or three times in my life.\n\nAfterwards, in the dressing room, nobody wanted to take off their costumes. We stayed in them for another hour, just sitting around, reluctant to leave the version of ourselves that had just done that.',
     2);

  -- 03 — rc4 arts night ----------------------------------------------------
  insert into public.entries (
    user_id, slug, title, title_html, eyebrow, medium, venue, performed_on,
    intro, pull_quote, video_caption, is_draft, sort_order
  ) values (
    v_user_id,
    'acapella-rc4-arts-night',
    'RC4 Arts Night - a capella',
    '<em>arts</em><br />night,<br />quietly.',
    'voice · a capella · rc4 arts night',
    'voice',
    'UTown Auditorium 3, NUS',
    '2026-02-07',
    'A capella was the part of me I''d kept small, for years. It''s a different kind of stage — smaller, closer, the audience can hear you breathing — and I love it the most for exactly that reason. At rc4 arts night I sang soprano two in a four-song set, and for the first time in a long time I remembered why.',
    'the held chord at the end — six beats longer than we''d rehearsed — because nobody wanted to be the first to let go.',
    'the closer · audio coming',
    false, 3
  )
  on conflict (user_id, slug) do update set updated_at = now()
  returning id into v_entry_id;

  delete from public.entry_sections where entry_id = v_entry_id;
  delete from public.entry_meta     where entry_id = v_entry_id;

  insert into public.entry_meta (entry_id, label, value, position) values
    (v_entry_id, 'date',  '07 feb 2026',                0),
    (v_entry_id, 'venue', 'rc4 multi-purpose hall',     1),
    (v_entry_id, 'group', 'rc4 a capella',              2),
    (v_entry_id, 'part',  'soprano 2',                  3);

  insert into public.entry_sections (entry_id, label, body, position) values
    (v_entry_id, 'i — the room',
     E'Rc4''s hall is the opposite of a concert stage: bright fluorescents, folding chairs, a carpeted floor that eats half the sound. We''d negotiated for warm amber lights and a single spotlight, and the moment they came up the room changed shape entirely.\n\nThere''s a trick, in a small room, of singing quieter than you think you should. The audience leans forward to meet you, and something happens in the space between that''s larger than anything you could have projected.',
     0),
    (v_entry_id, 'ii — the set',
     E'We opened with a ballad — bare arrangement, no percussion, everyone on held chords. Second song was a swingier cover, just to remind the audience (and ourselves) that we could. Third was the risky one: a dissonant minor piece that had taken us two months to get right. Fourth was the closer everyone knew.\n\nThe dissonant one is the one I''ll remember. We nailed the entry. The last chord held six beats longer than rehearsed because nobody wanted to let go.',
     1),
    (v_entry_id, 'iii — after',
     E'I stayed for the rest of arts night — the poetry set, the string quartet, the surprise taiko piece a neighbour had been secretly training for. Rc4 has this quality where the college, for one evening, becomes entirely about the thing its residents have been quietly making in private.\n\nI walked home and couldn''t sleep. I tried to hum the dissonant piece and got the chord wrong on purpose, just to feel it land again.',
     2);

  -- 04 — residance ---------------------------------------------------------
  insert into public.entries (
    user_id, slug, title, title_html, eyebrow, medium, venue, performed_on,
    intro, pull_quote, video_caption, is_draft, sort_order
  ) values (
    v_user_id,
    'girls-style-residance',
    'Residance',
    '<em>girls''</em><br />style,<br />residance.',
    'dance · girls'' style · residance',
    'dance',
    'University Cultural Centre Auditorium, NUS',
    '2026-04-12',
    'Girls'' style asks for a very specific kind of attention from your body — soft until it isn''t, every line deliberate, never apologising for taking up space. This was my first time choreographing part of a set, and it was also the set that scared me the most. Residance closed the year, and it closed it well.',
    'the silence before the beat dropped was so full I could hear my own pulse — then the room came down and everything I''d been worried about left.',
    'residance · full piece · tk',
    false, 4
  )
  on conflict (user_id, slug) do update set updated_at = now()
  returning id into v_entry_id;

  delete from public.entry_sections where entry_id = v_entry_id;
  delete from public.entry_meta     where entry_id = v_entry_id;

  insert into public.entry_meta (entry_id, label, value, position) values
    (v_entry_id, 'date',  '12 apr 2026',         0),
    (v_entry_id, 'venue', 'residance, rc4',      1),
    (v_entry_id, 'crew',  'residance dance',     2),
    (v_entry_id, 'piece', 'girls'' set — 2 min 40', 3);

  insert into public.entry_sections (entry_id, label, body, position) values
    (v_entry_id, 'i — choreographing',
     E'I''d been asked to put together the middle sixteen counts. It''s a small thing, and also it was enormous. I spent two weeks making a phrase I hated, then threw it out, then made something in twenty minutes that felt right. The material that arrives easiest is usually the most honest.\n\nTeaching it back to the crew was a separate vulnerability. They bent it into their own bodies. It stopped being mine somewhere around the third run-through, which is exactly how it''s supposed to work.',
     0),
    (v_entry_id, 'ii — the night',
     E'Residance is held in-hall, which means the audience is two metres from you and often includes people you live with. There''s no hiding. You can see your friends'' faces while you dance.\n\nWe opened on a slow walk. I don''t know how long it lasted. The silence before the music dropped was so full I could hear my own pulse. Then the beat hit and everything I''d been worried about left the room.',
     1),
    (v_entry_id, 'iii — closing the year',
     E'Four performances in seven months. I arrived in august not knowing if I''d find a dance family here. I leave for the holidays with four of them, overlapping and distinct and mine in different ways.\n\nThe thing I''m most grateful for is that nothing went perfectly. Every set had something that slipped. Every rehearsal had a fight or a cry or a too-loud laugh. The imperfection is the texture. Without it there''s nothing to remember.\n\nOn to the next.',
     2);

  raise notice 'seeded 4 entries for handle @%', v_handle;
end $$;
