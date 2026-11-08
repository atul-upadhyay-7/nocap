import React from 'react';
import {Outlet,useLocation} from 'react-router-dom';
import {Topbar,Dock} from './chrome.jsx';
import {Ambient,Spotlight,IntroLoader} from './ui.jsx';
export default function Layout(){
 const {pathname}=useLocation();
 return <div className="app">
  <Ambient/>
  <Spotlight/>
  <IntroLoader/>
  <Topbar/>
  <Dock/>
  <main className="shell">
   <div key={pathname} className="page-enter"><Outlet/></div>
   <footer className="foot panel-soft">Local demo only. Not escrow, a legal contract or a production payment service. AI never sets prices or authorizes payment.</footer>
  </main>
 </div>;
}
