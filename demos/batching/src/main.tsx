import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { installViteHMR } from '@react-logic/react-logic';
import { App } from './app/App';
installViteHMR(import.meta.hot);
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
