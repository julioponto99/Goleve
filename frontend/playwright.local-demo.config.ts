import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
 ...base,testMatch:'**/local-demo-live.check.ts',workers:1,retries:0,timeout:45000,
 outputDir:'.cache/local-demo-browser',
 use:{...base.use,baseURL:'http://127.0.0.1:5173',trace:'off',video:'off',screenshot:'off'},
 webServer:{command:'npm run dev --workspace=@goleve/web -- --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:false,timeout:30000,env:{VITE_API_BASE_URL:'http://127.0.0.1:3000'}},
 projects:[{name:'real-desktop',use:{viewport:{width:1440,height:1000}}}],
});
