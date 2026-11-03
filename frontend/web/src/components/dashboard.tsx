import type { PublicUser } from '@goleve/shared';
import { Badge, Card } from './ui';
import { dashboardModules, roleLabels } from '../navigation';
export function Breadcrumbs({current,onHome}:{current:string;onHome:()=>void}){
 return <nav className="breadcrumbs" aria-label="Localização"><a href="/" onClick={event=>{event.preventDefault();onHome();}}>Início</a><span aria-hidden="true">/</span><span aria-current="page">{current}</span></nav>;
}
export function DashboardFoundation({user}:{user:PublicUser}){
 return <>
  <section className="dashboard-heading"><Badge>{roleLabels[user.userType]}</Badge><h2>Olá, {user.name}.</h2><p className="muted">Este é o teu espaço no GoLeve. As funcionalidades abaixo ainda estão em preparação.</p></section>
  <p role="status" className="notice">Estrutura do painel disponível. Os dados e as operações de domínio serão integrados nas próximas etapas. Não são apresentados indicadores de exemplo.</p>
  <div className="dashboard-grid">{dashboardModules[user.userType].map(item=><Card key={item.title} className="dashboard-module"><Badge>{item.stage==='Indisponível'?'Indisponível':'Em preparação'}</Badge><h2>{item.title}</h2><p>{item.description}</p><p className="module-state">Ainda não disponível nesta interface</p>{item.blocker&&<p className="module-blocker">{item.blocker}</p>}</Card>)}</div>
 </>;
}
