import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import IntakePortal from './components/IntakePortal/IntakePortal.tsx';
import ClientPortal from './components/ClientPortal/ClientPortal.tsx';
import ClientDashboard from './components/ClientDashboard/ClientDashboard.tsx';
import './index.css';

// Three client-facing surfaces. Everything else is the operator's admin app.
//
//   /intake/<token>  filled in once, before the site is built
//   /portal/<token>  permanent, no account — works the minute the link is sent
//   /dashboard       signed in with Google; the only one that can grant a
//                    stylist access and revoke it again
//
// The token portal and the dashboard edit the same content through the same
// component and differ only in how a request is authenticated. Keeping both is
// deliberate: the link asks nothing of a client who will never make an account.
const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path.startsWith('/intake/') ? (
      <IntakePortal />
    ) : path.startsWith('/portal/') ? (
      <ClientPortal />
    ) : path.startsWith('/dashboard') ? (
      <ClientDashboard />
    ) : (
      <App />
    )}
  </StrictMode>,
);
