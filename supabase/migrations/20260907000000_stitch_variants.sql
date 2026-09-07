-- The two design directions offered on a new intake.
--
-- Its own column rather than a key inside client_intakes.data, for two reasons.
--
-- Size: a variant carries Stitch's style guidelines and rationale, about 6KB of
-- prose each. Folded into `data`, every read of every intake — including the
-- ones that only want a business name — would drag twelve kilobytes of design
-- essay along with it.
--
-- Lifecycle: this is generated, disposable, and regenerable. `data` holds what
-- the client told us, which is none of those things. Keeping them apart means
-- clearing a stale set of directions can never take a client's answers with it.
--
-- Shape: { "generatedAt": iso8601, "chosen": <index|null>, "variants": [ … ] }
-- Null means never generated, which is also what every intake taken before this
-- feature existed will read as — the UI must treat that as "nothing to choose
-- from", not as an error.
alter table if exists public.client_intakes
  add column if not exists stitch_variants jsonb;

comment on column public.client_intakes.stitch_variants is
  'Generated design directions from Stitch and which one the operator picked. Disposable: safe to clear and regenerate. Null means none were ever generated.';
