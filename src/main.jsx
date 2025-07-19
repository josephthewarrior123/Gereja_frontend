import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import utc from 'dayjs/plugin/utc.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(duration);
dayjs.extend(utc);

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
