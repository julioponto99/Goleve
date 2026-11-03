import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './ui1.css';
const element=document.getElementById('root');
if(!element)throw new Error('Application root missing');
createRoot(element).render(<React.StrictMode><App/></React.StrictMode>);
