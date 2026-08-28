import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import IntakePortal from './components/IntakePortal/IntakePortal.tsx';
import './index.css';

const isPortal = window.location.pathname.startsWith('/intake/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPortal ? <IntakePortal /> : <App />}
  </StrictMode>,
);
