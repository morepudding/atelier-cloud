import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './styles.css';
import './immersive.css';
import './learning/learning.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
