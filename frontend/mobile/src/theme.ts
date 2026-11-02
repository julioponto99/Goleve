import * as SecureStore from 'expo-secure-store';
import { createThemeStore, themeStorageKey } from '@goleve/shared';
const options={keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};
export function createDeviceThemeStore(){
 return createThemeStore({
  read:()=>SecureStore.getItemAsync(themeStorageKey,options),
  write:value=>SecureStore.setItemAsync(themeStorageKey,value,options)
 },'system');
}
