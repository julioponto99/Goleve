export function assertDemoNotifications(database?: string) {
  const flag=process.env.NOTIFICATION_DEMO_EVENTS_ENABLED||'false';
  if(!['true','false'].includes(flag))throw new Error('Invalid notification demonstration flag');
  if(flag==='true'&&(!['development','test'].includes(process.env.NODE_ENV||'')||database!==undefined&&!/^goleve_notification59_[a-f0-9]+_notification$/.test(database)))throw new Error('Demo notifications require an isolated local database and are forbidden in production');
}
