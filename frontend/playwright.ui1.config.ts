import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
 ...base,
 testMatch:'**/ui1-layout.check.ts',
 projects:[
  {name:'desktop-1920',use:{viewport:{width:1920,height:1080}}},
  {name:'desktop-1440',use:{viewport:{width:1440,height:1000}}},
  {name:'tablet-768',use:{viewport:{width:768,height:1024}}},
  {name:'phone-390',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ]
});
