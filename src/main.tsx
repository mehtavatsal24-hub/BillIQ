import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Intercept console.warn and console.error to suppress benign warnings and handle errors cleanly
const originalWarn = console.warn;
const originalError = console.error;

const shouldSuppress = (...args: any[]) => {
  try {
    const argStr = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message + " " + arg.stack;
      }
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ');

    const lower = argStr.toLowerCase();

    return lower.includes("detected an update time that is in the future") ||
           lower.includes("resource_exhausted") ||
           lower.includes("exceeded quota") ||
           lower.includes("failed to call the gemini api") ||
           lower.includes("internal assertion failed") ||
           lower.includes("unexpected state") ||
           lower.includes("@firebase/firestore") ||
           lower.includes("websocket closed without opened") ||
           lower.includes("could not reach cloud firestore backend") ||
           lower.includes("code=unavailable");
  } catch {
    return false;
  }
};

// Console warning and error overrides to keep developer console noise low
console.warn = function(...args: any[]) {
  if (shouldSuppress(...args)) return;
  originalWarn.apply(console, args);
};

console.error = function(...args: any[]) {
  if (shouldSuppress(...args)) return;
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
);


