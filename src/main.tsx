import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import IntakePortal from './components/IntakePortal/IntakePortal.tsx';
import ClientPortal from './components/ClientPortal/ClientPortal.tsx';
import './index.css';

// Two client-facing surfaces, both reached by an unguessable token and neither
// requiring an account:
//   /intake/<token>  filled in once, before the site is built
//   /portal/<token>  permanent — how she keeps her own portfolio current
// Everything else is the operator's admin app.
const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path.startsWith('/intake/') ? (
      <IntakePortal />
    ) : path.startsWith('/portal/') ? (
      <ClientPortal />
    ) : (
      <App />
    )}
  </StrictMode>,
);
