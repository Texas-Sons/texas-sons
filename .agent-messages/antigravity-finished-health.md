## Finished Task: Surface Blueprint Health

- Replaced active blueprint title block with a flex container showing the health pill next to the profile.
- Used `findBlueprintIssues` and `summariseIssues` to generate the summary text.
- If placeholders or missing content exist, an amber pill is shown with the issue summary.
- Clicking the pill toggles a dropdown listing each individual issue's field, severity, and message.
- The "DEPLOY SITE" and "Re-Deploy to Custom Domain" actions now show a `window.confirm` modal detailing the issues if `healthIssues.length > 0`.
- Verified Opalescent correctly shows no badge and other projects show the badge.
- `npm run verify` passes perfectly.
