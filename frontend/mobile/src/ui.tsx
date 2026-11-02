import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';
import { colors } from '@goleve/shared';
import type { Theme } from '@goleve/shared';
export function Button({children,onPress,theme,disabled=false,secondary=false}:{children:string;onPress:()=>void;theme:Theme;disabled?:boolean;secondary?:boolean}){
 const c=colors[theme];return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[styles.button,{backgroundColor:secondary?c.raised:c.accent,opacity:disabled?.5:pressed?.8:1}]}><Text style={[styles.buttonText,{color:secondary?c.text:c.accentText}]}>{children}</Text></Pressable>;
}
export function Card({children,theme}:{children:ReactNode;theme:Theme}){return <View style={[styles.card,{backgroundColor:colors[theme].surface,borderColor:colors[theme].border}]}>{children}</View>;}
export function LoadingState({theme,label='A carregar…'}:{theme:Theme;label?:string}){return <View accessibilityRole="progressbar" style={styles.state}><ActivityIndicator color={colors[theme].selectedText}/><Text style={[styles.body,{color:colors[theme].muted}]}>{label}</Text></View>;}
export function MessageState({theme,title,children,error=false}:{theme:Theme;title:string;children:string;error?:boolean}){
 const c=colors[theme];return <View accessibilityRole={error?'alert':undefined} style={styles.state}><Text accessibilityRole="header" style={[styles.title,{color:error?c.danger:c.text}]}>{title}</Text><Text style={[styles.body,{color:c.muted}]}>{children}</Text></View>;
}
export function TextField({theme,label,error,...props}:TextInputProps&{theme:Theme;label:string;error?:string}){
 const c=colors[theme];return <View style={styles.field}><Text style={[styles.body,{color:c.text}]}>{label}</Text><TextInput {...props} accessibilityLabel={label} placeholderTextColor={c.muted} style={[styles.input,{backgroundColor:c.background,color:c.text,borderColor:error?c.danger:c.border},props.style]}/>{error&&<Text accessibilityRole="alert" style={[styles.body,{color:c.danger}]}>{error}</Text>}</View>;
}
const styles=StyleSheet.create({button:{minHeight:48,borderRadius:10,paddingVertical:14,paddingHorizontal:18,justifyContent:'center',alignItems:'center'},buttonText:{fontFamily:'Inter_600SemiBold',fontSize:14},card:{padding:24,borderWidth:1,borderRadius:16,gap:20},state:{gap:12,paddingVertical:12},title:{fontFamily:'Inter_700Bold',fontSize:21},body:{fontFamily:'Inter_400Regular',fontSize:14,lineHeight:23},field:{gap:8},input:{minHeight:48,borderRadius:10,borderWidth:1,padding:14,fontFamily:'Inter_400Regular',fontSize:16}});
