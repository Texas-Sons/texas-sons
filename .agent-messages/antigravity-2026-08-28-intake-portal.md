## Intake Portal UI Complete

- Created the public `/intake/<token>` route with `<IntakePortal>` component.
- Implemented client-side image downscaling (canvas via `imageUtils.ts`) to avoid 8MB limit.
- Updated `ClientIntakeView.tsx` with link generation, revocation, and submission review UI.
- Tested e2e with a real Puppeteer browser (uploaded 3 phone sized photos) and simulated the application merge to the intake record.
