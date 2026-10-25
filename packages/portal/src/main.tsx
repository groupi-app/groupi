'use client';
import { createRoot } from 'react-dom/client';
import { Portal } from './index';
import './styles.css';
const root = document.getElementById('root');
if (!root) throw new Error('Portal root element is missing');
createRoot(root).render(<Portal />);
