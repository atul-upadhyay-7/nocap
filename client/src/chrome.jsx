import React,{useEffect,useRef} from 'react';
import {NavLink,useLocation} from 'react-router-dom';
import {Home,FileText,ClipboardCheck,CreditCard,ReceiptText,Check} from 'lucide-react';
import {useScopePay} from './state.jsx';

const NAV=[
 {to:'/',label:'Home',icon:Home,end:true},
 {to:'/brief',label:'New brief',icon:FileText},
 {to:'/review',label:'Review',icon:ClipboardCheck},
 {to:'/payment',label:'Payment',icon:CreditCard},
 {to:'/receipts',label:'Receipts',icon:ReceiptText},
];
const STEPS=[['brief','Brief'],['draft','Draft'],['review','Review'],['paid','Paid']];

export function Topbar(){
 const location=useLocation();
 return <header className="topbar">
  <NavLink to="/" className="brand" aria-label="ScopePay home">
   <span className="brand-dot">S</span>
   <span className="brand-name">ScopePay<span style={{color:'var(--ember)'}}>.</span></span>
  </NavLink>
  <nav className="pillnav" aria-label="Pages">
   {NAV.map(({to,label,end})=>
    <NavLink key={to} to={to} end={end}
     className={({isActive})=>isActive?'active':''}
     aria-current={location.pathname===to?'page':undefined}>{label}</NavLink>)}
  </nav>
  <span className="sandbox-chip">SANDBOX ONLY</span>
 </header>;
}

// macOS-style dock magnification (Skiper / Cult UI pattern, hand-built):
// icons scale with pointer proximity along the dock's vertical axis.
// Desktop only; skipped entirely under prefers-reduced-motion.
function useDockMagnification(){
 const ref=useRef(null);
 useEffect(()=>{
  const dock=ref.current;if(!dock)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   dock.classList.add('mag-off');return;
  }
  const mq=window.matchMedia('(max-width: 720px)');
  if(mq.matches){dock.classList.add('mag-off');return;}
  const RANGE=95,MAX=1.4;
  function move(e){
   const links=dock.querySelectorAll('a');
   for(const a of links){
    const r=a.getBoundingClientRect();
    const d=Math.abs(e.clientY-(r.top+r.height/2));
    const t=Math.max(0,1-d/RANGE);
    a.style.transform=t>0?`scale(${(1+(MAX-1)*t*t).toFixed(3)})`:'';
   }
  }
  function leave(){dock.querySelectorAll('a').forEach(a=>{a.style.transform='';});}
  dock.addEventListener('mousemove',move);
  dock.addEventListener('mouseleave',leave);
  return ()=>{dock.removeEventListener('mousemove',move);dock.removeEventListener('mouseleave',leave);};
 },[]);
 return ref;
}

export function Dock(){
 const {stepDone}=useScopePay();
 const magRef=useDockMagnification();
 return <nav className="dock" aria-label="Sections" ref={magRef}>
  {NAV.map(({to,label,icon:Icon,end})=>
   <NavLink key={to} to={to} end={end} title={label} aria-label={label}
    className={({isActive})=>isActive?'active':''}>
    <Icon size={19} strokeWidth={2.1}/>
   </NavLink>)}
  <span className="dock-sep" aria-hidden="true"/>
  <span className="steps" aria-label="Progress">
   {STEPS.map(([key,label],i)=>{
    const done=stepDone[key];
    const current=!done&&STEPS.slice(0,i).every(([k])=>stepDone[k]);
    return <span key={key} title={label} aria-label={`${label}: ${done?'done':current?'current':'pending'}`}
     className={'step-dot'+(done?' done':current?' current':'')}>
     {done?<Check size={10} strokeWidth={3.5}/>:null}
    </span>;})}
  </span>
 </nav>;
}
