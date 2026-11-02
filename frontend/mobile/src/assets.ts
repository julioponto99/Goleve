import type { ImageSourcePropType } from 'react-native';
// Original 1x Figma exports remain under shared/assets/figma/mobile for provenance.
// Navigation renders the original vector font, so these bitmaps are not bundled.
export const brandIcons:Record<'dark'|'light',ImageSourcePropType>={
 dark:require('@goleve/shared/assets/branding/icone-dark-512.png'),
 light:require('@goleve/shared/assets/branding/icone-lime-512.png')
};
