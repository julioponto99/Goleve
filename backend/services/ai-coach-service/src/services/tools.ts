import { Tool, TOOLS } from '../models';
import { integer, invalid, object, text, identifier, instant, zone } from '../config/validation';
import { safeText } from '../config/privacy';
export interface ToolParameters {
  'hydration.set_goal': { targetMl: number; timezone: string };
  'training.create_plan': { title: string; goals: string[]; days: string[]; environment: string; exercises: { exerciseId: string; sets: number; repetitions: number }[] };
  'user.create_activity_goal': { title: string; metric: 'steps' | 'active_minutes'; value: number };
  'agenda.create_activity': { title: string; kind: 'personal' | 'workout'; environment?: string; startAt: string; endAt: string; timezone: string };
}
export type ValidatedTool = { [K in Tool]: { tool: K; parameters: ToolParameters[K] } }[Tool];
function strings(value: unknown, max: number, length: number): string[] {
  if (!Array.isArray(value) || value.length > max) return invalid('Invalid bounded list');
  return value.map(v => safeText(v, length));
}
export function validateTool(name: unknown, value: unknown, now = new Date()): ValidatedTool {
  if (typeof name !== 'string' || !TOOLS.includes(name as Tool)) return invalid('Tool is not permitted');
  if (name === 'hydration.set_goal') { const d = object(value, ['targetMl', 'timezone']); return { tool: name, parameters: { targetMl: integer(d.targetMl, 250, 20000), timezone: zone(d.timezone) } }; }
  if (name === 'training.create_plan') {
    const d = object(value, ['title', 'goals', 'days', 'environment', 'exercises']);
    if (!['home', 'gym', 'outdoor'].includes(String(d.environment)) || !Array.isArray(d.exercises) || !d.exercises.length || d.exercises.length > 20) return invalid('Invalid training plan');
    const exercises = d.exercises.map(v => { const e = object(v, ['exerciseId', 'sets', 'repetitions']); return { exerciseId: identifier(e.exerciseId), sets: integer(e.sets, 1, 100), repetitions: integer(e.repetitions, 1, 1000) }; });
    return { tool: name, parameters: { title: safeText(d.title, 160), goals: strings(d.goals ?? [], 10, 100), days: strings(d.days ?? [], 7, 30), environment: String(d.environment), exercises } };
  }
  if (name === 'user.create_activity_goal') {
    const d = object(value, ['title', 'metric', 'value']); if (!['steps', 'active_minutes'].includes(String(d.metric))) return invalid('Only autonomous activity goals are permitted');
    return { tool: name, parameters: { title: safeText(d.title, 120), metric: d.metric as 'steps' | 'active_minutes', value: integer(d.value, 1, d.metric === 'steps' ? 200000 : 1440) } };
  }
  const d = object(value, ['title', 'kind', 'environment', 'startAt', 'endAt', 'timezone']);
  if (!['personal', 'workout'].includes(String(d.kind)) || (d.kind === 'workout' ? !['home', 'gym', 'outdoor'].includes(String(d.environment)) : d.environment !== undefined)) return invalid('Invalid personal activity kind/environment');
  const start = instant(d.startAt), end = instant(d.endAt);
  if (start <= now || end <= start || end.getTime() - start.getTime() > 86400000) return invalid('Coach activities must be future intervals of at most 24 hours');
  return { tool: 'agenda.create_activity', parameters: { title: safeText(d.title, 160), kind: d.kind as 'personal' | 'workout', ...(d.environment ? { environment: String(d.environment) } : {}), startAt: start.toISOString(), endAt: end.toISOString(), timezone: zone(d.timezone) } };
}
// The model receives contracts, never a URL, HTTP method, credential or capability to execute.
export const toolCatalog = [
  { name: 'hydration.set_goal', parameters: { targetMl: 'integer 250..20000 (technical limits, not a medical recommendation)', timezone: 'IANA timezone' } },
  { name: 'training.create_plan', parameters: { title: 'text <=160', goals: 'text[] <=10', days: 'text[] <=7', environment: 'home|gym|outdoor', exercises: '[{exerciseId: accessible catalogue ID, sets: integer 1..100, repetitions: integer 1..1000}], 1..20' } },
  { name: 'user.create_activity_goal', parameters: { title: 'text <=120', metric: 'steps|active_minutes', value: 'positive integer (steps <=200000; minutes <=1440)' } },
  { name: 'agenda.create_activity', parameters: { title: 'text <=160', kind: 'personal|workout', environment: 'only for workout: home|gym|outdoor', startAt: 'future ISO instant with offset', endAt: 'later ISO instant with offset', timezone: 'IANA timezone' } },
];
