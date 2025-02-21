import React from 'react';
import { Counter } from './components/Counter';

// createRoot(document.getElementById('ct-root')).render(<Counter initial={5} />);
window.__PW_CT_MOUNT__(<Counter initial={5} />);