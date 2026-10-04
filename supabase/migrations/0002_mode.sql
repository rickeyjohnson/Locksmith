-- Records whether an attempt came from normal progression or from a playtest
-- session with every level unlocked (PLAYTEST_UNLOCK_ALL=true). Free-play rows let
-- levels 6-8 be tested by humans at all, but they are not comparable to progression
-- rows — a player dropped straight into level 8 has not warmed up on 1 through 7 —
-- so analysis must group by this column rather than pooling them.

alter table attempts add column if not exists mode text
  check (mode in ('progression', 'free'));
alter table guesses add column if not exists mode text
  check (mode in ('progression', 'free'));

update attempts set mode = 'progression' where mode is null;
update guesses set mode = 'progression' where mode is null;
