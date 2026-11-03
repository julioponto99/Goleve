import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=Number(process.env.GOLEVE_WEB_TEST_PORT??5174);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid frontend test port');
const origin='http://127.0.0.1:'+port;
export default defineConfig({
 testDir:'./tests/browser',fullyParallel:false,workers:1,retries:0,timeout:20000,
 outputDir:'test-results',reporter:'list',
 use:{baseURL:origin,trace:'retain-on-failure',launchOptions:fs.existsSync(chrome)?{executablePath:chrome}:{}},
 // Regression fixtures intercept this origin. Never send mocked test credentials to the real local-demo API.
 webServer:{command:'npm run dev --workspace=@goleve/web -- --port '+port,url:origin,reuseExistingServer:false,timeout:30000,env:{VITE_API_BASE_URL:'http://127.0.0.1:64344'}},
 projects:[
  {name:'desktop-web',use:{viewport:{width:1440,height:1000}}},
  {name:'responsive-web',use:{viewport:{width:402,height:874},isMobile:true,hasTouch:true}}
 ]
});
