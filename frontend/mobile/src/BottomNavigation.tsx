import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, mobileTabs, routes } from '@goleve/shared';
import type { AppRoute, RouteId, Theme } from '@goleve/shared';

// The exact Font Awesome 6 Free Solid glyphs used by Figma 178:44/46/48/50.
export const navigationGlyphs={home:'\uf015',training:'\uf44b',measurements:'\ue473',coach:'\uf544'} as const;
export const navigationFont=require('@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf');

export function BottomNavigation({theme,selected,onNavigate,iconsLoaded,onHeightChange}:{theme:Theme;selected:RouteId;onNavigate:(route:AppRoute)=>void;iconsLoaded:boolean;onHeightChange:(height:number)=>void}){
 const c=colors[theme],insets=useSafeAreaInsets();
 return <View accessibilityRole="tablist" onLayout={event=>onHeightChange(event.nativeEvent.layout.height)} style={[styles.bar,{bottom:Math.max(insets.bottom,12),backgroundColor:c.surface,borderColor:c.border}]}>
  {mobileTabs.map(id=>{
   const route=routes.find(item=>item.id===id)!,active=selected===id;
   return <Pressable key={id} accessibilityRole="tab" accessibilityLabel={route.label} accessibilityState={{selected:active}} onPress={()=>onNavigate(route)} style={[styles.tab,active&&{backgroundColor:c.selection}]}>
    <View style={styles.iconSlot} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
     {iconsLoaded&&<Text allowFontScaling={false} style={[styles.icon,{color:active?c.selectedText:c.muted}]}>{navigationGlyphs[id as keyof typeof navigationGlyphs]}</Text>}
    </View>
    <Text style={[styles.label,{color:active?c.selectedText:c.muted}]}>{route.label}</Text>
   </Pressable>;
  })}
 </View>;
}
const styles=StyleSheet.create({
 bar:{position:'absolute',left:12,right:12,borderWidth:1,borderRadius:18,flexDirection:'row',padding:4,gap:2,minHeight:64},
 tab:{flex:1,alignItems:'center',justifyContent:'center',minHeight:54,paddingVertical:5,gap:3,borderRadius:14},
 iconSlot:{width:24,height:24,alignItems:'center',justifyContent:'center'},
 icon:{fontFamily:'GoLeveNavigation',fontSize:18,lineHeight:24,includeFontPadding:false,textAlign:'center'},
 label:{fontFamily:'Inter_600SemiBold',fontSize:11,textAlign:'center',flexShrink:1}
});
