-- Is this a demo or a paid engagement?
--
-- The distinction changes what the operator should be warned about. A demo is a
-- mockup shown to a prospect: a stock hero and no phone number are expected, and
-- warning about them is noise. Once a client is paying, the same blueprint
-- publishing a stand-in phone number is a live business nobody can call.
--
-- Kept out of the blueprint on purpose. The blueprint is published verbatim into
-- the client's own HTML, and "engagement": "demo" in the page source of a site
-- someone has paid for is a bad look for a detail that is nobody's business but
-- the operator's.
--
-- Defaults to 'demo' because that is what everything starts as, and because the
-- safe direction for a default is the one that shows more warnings rather than
-- fewer.
alter table if exists public.projects
  add column if not exists engagement text not null default 'demo'
  check (engagement in ('demo', 'commissioned'));

comment on column public.projects.engagement is
  'demo = a mockup for a prospect. commissioned = a paying client. Controls which health warnings are shown, never what is published.';
