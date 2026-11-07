import React from 'react';
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

export function Dock(){
 const {stepDone}=useScopePay();
 return <nav className="dock" aria-label="Sections">
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
