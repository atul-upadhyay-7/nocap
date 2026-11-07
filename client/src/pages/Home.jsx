import React from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Eyebrow,Reveal,SplitText,CountUp} from '../ui.jsx';
import {ArrowRight,ShieldCheck,FileSearch,BadgeDollarSign} from 'lucide-react';
const STEPS=[
 ['Paste a synthetic brief','A practice client brief, never real work. The AI drafts a scope with evidence copied word for word from your text.'],
 ['You review the draft','Nothing is priced or approved by the AI. You check the deliverables, questions and conflicts, then explicitly save a review.'],
 ['Sandbox payment','One fixed USD 10.00 test item. PayPal sandbox checkout, server-confirmed capture, and a receipt you can verify.'],
];
const KPIS=[
 {icon:BadgeDollarSign,value:10,decimals:2,prefix:'$',label:'Fixed price, server-owned'},
 {icon:FileSearch,value:100,decimals:0,suffix:'%',label:'Evidence verbatim from the brief'},
 {icon:ShieldCheck,value:0,decimals:0,label:'Approvals the AI can make'},
];
const LIMITS=[
 'Fixed price of USD 10.00, owned by the server. Nobody, including the AI, can change it.',
 'PayPal sandbox only. There is no live mode in the code.',
 'Every order needs your saved review first. The AI cannot approve anything.',
 'Local demo. Not escrow, not a contract, not a production payment service.',
];
export default function Home(){
 return <>
  <Reveal className="border-b pb-9">
   <Eyebrow>Sandbox demo - no real money</Eyebrow>
   <SplitText as="h1" text="Scope review before a single dollar moves." wordDelay={90} className="mt-3.5 block max-w-[640px] font-serif text-[clamp(34px,4.6vw,52px)] font-medium leading-[1.08] tracking-tight"/>
   <p className="mt-4 max-w-[560px] text-[16.5px] leading-relaxed text-secondary-foreground">ScopePay turns a client brief into a reviewed scope draft, then collects one fixed sandbox payment through PayPal. The AI drafts. Only you approve.</p>
   <div className="mt-8 flex flex-wrap gap-2.5">
    <Button asChild className="group"><Link to="/brief">Start a brief<ArrowRight className="transition-transform duration-200 group-hover:translate-x-1"/></Link></Button>
    <Button asChild variant="outline"><Link to="/receipts">See receipts</Link></Button>
   </div>
  </Reveal>
  <Reveal delay={140} className="kpis mt-9">
   {KPIS.map((k,i)=>
    <div key={i} className="kpi panel reveal" style={{'--reveal-delay':(140+i*90)+'ms'}}>
     <div className="kpi-top">
      <span className="kpi-icon"><k.icon size={17} strokeWidth={2.2}/></span>
     </div>
     <span className="kpi-value">{k.prefix||''}<CountUp value={k.value} decimals={k.decimals}/>{k.suffix||''}</span>
     <span className="kpi-label">{k.label}</span>
    </div>)}
  </Reveal>
  <div className="mt-2">{STEPS.map(([title,text],i)=>
   <Reveal key={i} delay={240+i*90} className="grid grid-cols-[44px_1fr] gap-4 border-b py-6">
    <span className="pt-1 font-mono text-xs font-medium text-ember">0{i+1}</span>
    <div><h3 className="font-serif text-[19px] font-semibold tracking-tight">{title}</h3>
    <p className="mt-1.5 max-w-[520px] text-sm leading-relaxed text-secondary-foreground">{text}</p></div>
   </Reveal>)}
  </div>
  <Reveal delay={560} className="card-lift panel mt-8 p-6 sm:p-7">
   <Eyebrow>Honest limits</Eyebrow>
   <ul className="mt-2.5 list-disc space-y-2 pl-[18px] marker:text-ember">{LIMITS.map((l,i)=>
    <li key={i} className="text-sm leading-relaxed text-secondary-foreground">{l}</li>)}</ul>
  </Reveal>
 </>;
}
