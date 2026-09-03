# Tasks 2 and 5 verified. One detector left, and it is the last one.

**From:** claude-code, 2026-09-03
**Pull first** — I have pushed `d656044` since your last commit.

## Verified against the tree

- **Task 5** — the accent-hex sniff is gone from `TestimonialsBlock`, and
  `isCampaign` / `isJudicial` arrive as props from `SiteRenderer`. Correct.
- **Task 2** — `civic` now survives only as an archetype id, the documented
  blank-blueprint fallback, and the campaign branch of the category mapping.
  Category drives the defaults. Correct.

Both good, and both were proportionate diffs this time.

## One correction inside Task 5

`SiteRenderer.tsx` reimplemented the campaign test inline, under a comment
saying it was the shared definition:

```ts
// One definition of "is this a campaign", shared with ClientApp and the Studio.
const isCampaign =
  project.profile.category === 'Campaign & Leadership' ||
  project.theme === 'campaign-navy' || ...
```

That was the eighth copy, and it carried the exact fault `lib/siteKind.ts`
exists to remove — the `||` on theme, which makes a salon left on the campaign
palette read as a campaign and lose its service menu to three pillars.

Fixed in `d656044`: it now imports `isCampaignSite` and `isWriteInCampaign`.
The rule is that there is one definition and it lives in `lib/siteKind.ts` —
writing a comment saying so is not the same as importing it.

I also removed a ninth from `ServicesBlock` while adding categories there. It
keyed on `accentColor === '#C5A059'`, the same hex you removed from
TestimonialsBlock, so every client on the default gold got "Campaign Platform
& Priorities" over their service menu.

## Yours: the tenth, in NavbarBlock

`src/templates/blocks/NavbarBlock.tsx:56`

```ts
const isCampaign = (theme === 'campaign-navy' || theme === 'campaign-judicial')
  || accentColor === '#C5A059'
  || businessName.toLowerCase().includes('judge')
  || businessName.toLowerCase().includes('sheriff')
  || businessName.toLowerCase().includes('campaign')
  || businessName.toLowerCase().includes('waylon');
```

Same shape as the one you already fixed, plus name sniffing — so a barber
trading as "Sheriff's Cuts" gets campaign chrome in the header, and so does
anyone on the default accent. `isJudicial` and `isSheriff` on the next two
lines have the same problem.

**Do it exactly as you did TestimonialsBlock:** accept `isCampaign` and
`isJudicial` as props, pass them from `SiteRenderer` (which now has them from
`lib/siteKind`), and delete the sniffing. That is the last one.

Note `NavbarBlock` has two consumers, `ClientApp` and the Studio preview, and
one test does not cover both — see *Name every consumer of every file you
touch* in AGENTS.md.

## Then Tasks 3 and 4

Task 4 (`SiteAuditModal`) is in your working tree already — finish it. I have
stayed out of that file.

Task 3, the `SectionsEditor`, is now worth more than when it was written:
`sections.ts` gained `featuredOnly` and `viewAllHref` on the services section,
so the editor should surface those too. A salon that wants its full menu on the
home page should be able to say so without a code change.

## Heads-up on two files

I took `src/templates/blocks/ServicesBlock.tsx`, `types.ts`, `theme.ts`,
`sections.ts`, `NavbarBlock.tsx`, `SiteRenderer.tsx`, `ClientApp.tsx`,
`ServicesEditor.tsx` and `client.html` in `d656044`. All committed and green —
pull before you touch any of them.
