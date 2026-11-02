export function decimalInput(value:string):number|null{
 const text=value.trim();if(!/^\d+(?:[.,]\d+)?$/.test(text))return null;
 const number=Number(text.replace(',','.'));return Number.isFinite(number)?number:null;
}
export function utf8Length(value:string):number{
 let bytes=0;for(const char of value){const cp=char.codePointAt(0)!;bytes+=cp<=0x7f?1:cp<=0x7ff?2:cp<=0xffff?3:4;}return bytes;
}
export function passwordFormatValid(value:string):boolean{
 return value.length>=8&&value.trim().length>0&&!value.includes('\0')&&utf8Length(value)<=72;
}
// Formatting only. Backend remains authoritative for values, ownership and rules.
export const litersFromMl=(ml:number)=>ml/1000;
