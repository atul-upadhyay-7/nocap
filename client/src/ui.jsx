import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Check,Lock} from 'lucide-react';
import {cn} from '@/lib/utils';
const STEPS=[['brief','Brief'],['draft','Draft'],['review','Review'],['paid','Payment']];
export function Stepper({done}){
 return <ol className="flex flex-col">{STEPS.map(([key,label],i)=>{
  const isDone=done[key];
  const current=!isDone&&STEPS.slice(0,i).every(([k])=>done[k]);
  return <li key={key} className="relative flex items-center gap-2.5 py-[5px] text-[12.5px] text-muted-foreground">
   {i<STEPS.length-1&&<span className="absolute bottom-[-4px] left-[7px] top-[26px] w-px bg-input"/>}
   <span className={cn('z-[1] inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border bg-sidebar-background font-mono text-[8.5px] transition-all duration-300',
    isDone?'border-ember bg-ember text-primary-foreground':current?'border-ember ring-[3px] ring-accent':'border-input')}>
    {isDone?<Check size={10} strokeWidth={3.5}/>:i+1}</span>
   <span className={cn(isDone&&'text-secondary-foreground',current&&'font-semibold text-accent-foreground')}>{label}</span>
  </li>;})}</ol>;
}
export function Eyebrow({children,className}){return <p className={cn('font-mono text-[10.5px] font-medium uppercase tracking-[2.2px] text-ember',className)}>{children}</p>;}

export function Reveal({children,delay=0,className}){
 return <div className={cn('reveal',className)} style={{'--reveal-delay':delay+'ms'}}>{children}</div>;
}

export function SplitText({text,as:Tag='span',className,wordDelay=70,startDelay=0,highlight=[]}){
 return <Tag className={className} aria-label={text}>{text.split(' ').map((w,i)=>
  <span key={i} aria-hidden="true" className={'split-word'+(highlight.includes(w)?' grad-text':'')} style={{'--split-delay':(startDelay+i*wordDelay)+'ms'}}>{w}{i<text.split(' ').length-1?'\u00A0':''}</span>)}</Tag>;
}

// hover.dev-style magnetic wrapper: the child eases toward the pointer inside
// a small radius and springs back. Desktop + motion-safe only.
export function Magnetic({children,className,strength=0.32}){
 const ref=useRef(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(window.matchMedia('(hover: none)').matches)return;
  const RANGE=80;
  function move(e){
   const r=el.getBoundingClientRect();
   const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
   if(Math.hypot(dx,dy)<RANGE){
    const mx=Math.max(-10,Math.min(10,dx*strength)),my=Math.max(-8,Math.min(8,dy*strength));
    el.style.transform=`translate(${mx.toFixed(1)}px,${my.toFixed(1)}px)`;
   }
   else el.style.transform='';
  }
  function leave(){el.style.transform='';}
  window.addEventListener('mousemove',move,{passive:true});
  el.addEventListener('mouseleave',leave);
  return ()=>{window.removeEventListener('mousemove',move);el.removeEventListener('mouseleave',leave);};
 },[strength]);
 return <span ref={ref} className={cn('magnetic',className)}>{children}</span>;
}

// Custom cursor accent (hover.dev / Skiper pattern, hand-built): a small ember
// dot glued to the pointer plus a lagging ring that swells over interactive
// elements. Native cursor stays visible. Desktop + motion-safe only.
export function CursorFx(){
 const dotRef=useRef(null),ringRef=useRef(null);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(window.matchMedia('(hover: none)').matches)return;
  const dot=dotRef.current,ring=ringRef.current;if(!dot||!ring)return;
  let x=innerWidth/2,y=innerHeight/2,rx=x,ry=y,raf,seen=false;
  function move(e){
   x=e.clientX;y=e.clientY;
   if(!seen){seen=true;dot.style.opacity='1';ring.style.opacity='1';rx=x;ry=y;}
   const t=e.target&&e.target.closest?e.target.closest('a,button,[role=tab],[role=checkbox],[role=switch],input,textarea,select,label,.ag-row'):null;
   ring.classList.toggle('cursor-hot',!!t);
  }
  function loop(){
   rx+=(x-rx)*0.16;ry+=(y-ry)*0.16;
   dot.style.transform=`translate(${x}px,${y}px)`;
   ring.style.transform=`translate(${rx}px,${ry}px)`;
   raf=requestAnimationFrame(loop);
  }
  window.addEventListener('mousemove',move,{passive:true});
  raf=requestAnimationFrame(loop);
  return ()=>{window.removeEventListener('mousemove',move);cancelAnimationFrame(raf);};
 },[]);
 return <>
  <div ref={dotRef} className="cursor-dot" aria-hidden="true"/>
  <div ref={ringRef} className="cursor-ring" aria-hidden="true"/>
 </>;
}

// Subtle 3D tilt that follows the pointer across a card (max a few degrees).
export function Tilt({children,className,max=5}){
 const ref=useRef(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(window.matchMedia('(hover: none)').matches)return;
  function move(e){
   const r=el.getBoundingClientRect();
   const px=(e.clientX-r.left)/r.width-0.5,py=(e.clientY-r.top)/r.height-0.5;
   el.style.transform=`perspective(700px) rotateX(${(-py*max).toFixed(2)}deg) rotateY(${(px*max).toFixed(2)}deg)`;
  }
  function leave(){el.style.transform='';}
  el.addEventListener('mousemove',move);
  el.addEventListener('mouseleave',leave);
  return ()=>{el.removeEventListener('mousemove',move);el.removeEventListener('mouseleave',leave);};
 },[max]);
 return <div ref={ref} className={cn('tilt',className)}>{children}</div>;
}

// Thin ember scroll-progress bar pinned to the top of the viewport.
export function ScrollProgress(){
 const ref=useRef(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  function onScroll(){
   const h=document.documentElement;
   const p=h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight);
   el.style.transform=`scaleX(${p})`;
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
  return ()=>window.removeEventListener('scroll',onScroll);
 },[]);
 return <div ref={ref} className="scroll-progress" aria-hidden="true"/>;
}

// Ember confetti burst for the moment a sandbox capture completes.
export function EmberBurst({count=90}){
 const ref=useRef(null);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const cv=ref.current;if(!cv)return;
  const ctx=cv.getContext('2d');
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=window.innerWidth,h=window.innerHeight;
  cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  let seed=(Date.now()%2147483647)||9;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
  const cx=w/2,cy=h*0.55;
  const P=[];
  for(let i=0;i<count;i++){
   const a=-Math.PI/2+(rnd()-0.5)*2.2;
   const sp=4+rnd()*9;
   P.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:1.5+rnd()*2.5,life:1,decay:0.008+rnd()*0.012,rose:rnd()>0.78});
  }
  let raf;
  function frame(){
   ctx.clearRect(0,0,w,h);
   let alive=false;
   for(const p of P){
    if(p.life<=0)continue;alive=true;
    p.vy+=0.16;p.vx*=0.985;
    p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;
    const a=Math.max(0,p.life);
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);
    ctx.fillStyle=p.rose?`rgba(232,93,117,${(a*0.9).toFixed(3)})`:`rgba(255,${Math.round(106+80*(1-a))},60,${(a*0.9).toFixed(3)})`;
    ctx.fill();
   }
   if(alive)raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return ()=>cancelAnimationFrame(raf);
 },[count]);
 return <canvas ref={ref} className="ember-burst" aria-hidden="true"/>;
}

// Gather (gather.be-of-dao.com) style hero field, hand-built on canvas:
// ember particles drift and gently gather toward the pointer. Reduced-motion
// users get none of it (the static Ambient glow stays).
export function HeroParticles({count=90,className}){
 const ref=useRef(null);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const cv=ref.current;if(!cv)return;
  const ctx=cv.getContext('2d');
  let w=0,h=0,raf;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const mouse={x:-9999,y:-9999};
  function size(){const r=cv.parentElement.getBoundingClientRect();w=r.width;h=r.height;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  size();
  let seed=7;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
  const P=[];
  for(let i=0;i<count;i++)P.push({x:rnd()*w,y:rnd()*h,vx:0,vy:0,r:1+rnd()*2.2,tw:rnd()*6.28});
  function onMove(e){const r=cv.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;}
  function onLeave(){mouse.x=-9999;mouse.y=-9999;}
  window.addEventListener('mousemove',onMove,{passive:true});
  window.addEventListener('mouseout',onLeave);
  window.addEventListener('resize',size);
  let t=0;
  function frame(){
   t+=0.016;ctx.clearRect(0,0,w,h);
   for(const p of P){
    const dx=mouse.x-p.x,dy=mouse.y-p.y;const d=Math.hypot(dx,dy);
    if(d<230&&d>1){const f=(1-d/230)*0.42;p.vx+=dx/d*f;p.vy+=dy/d*f;}
    p.vx+=Math.sin(t*0.7+p.tw)*0.012;p.vy+=Math.cos(t*0.6+p.tw)*0.012;
    p.vx*=0.94;p.vy*=0.94;
    p.x+=p.vx+0.12;p.y+=p.vy;
    if(p.x>w+10)p.x=-10;else if(p.x<-10)p.x=w+10;
    if(p.y>h+10)p.y=-10;else if(p.y<-10)p.y=h+10;
    const a=0.22+0.35*Math.abs(Math.sin(t*1.3+p.tw));
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);
    ctx.fillStyle=`rgba(255,138,76,${a.toFixed(3)})`;ctx.fill();
   }
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return ()=>{cancelAnimationFrame(raf);window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseout',onLeave);window.removeEventListener('resize',size);};
 },[count]);
 return <canvas ref={ref} aria-hidden="true" className={cn('hero-particles',className)}/>;
}

// Gather-style intro: ember particles fly in and form the wordmark once per
// session, then the overlay fades away. Skipped for reduced motion.
export function IntroLoader(){
 const [gone,setGone]=useState(()=>{try{return sessionStorage.getItem('sp-intro-seen')==='1';}catch{return true;}});
 const [fade,setFade]=useState(false);
 const ref=useRef(null);
 useEffect(()=>{
  if(gone)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   try{sessionStorage.setItem('sp-intro-seen','1');}catch{}
   setGone(true);return;
  }
  const cv=ref.current;if(!cv)return;
  const ctx=cv.getContext('2d');
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=window.innerWidth,h=window.innerHeight;
  cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const off=document.createElement('canvas');off.width=w;off.height=h;
  const octx=off.getContext('2d');
  octx.fillStyle='#fff';
  const fs=Math.min(150,Math.max(64,w*0.22));
  octx.font=`600 ${fs}px Georgia, 'Times New Roman', serif`;
  octx.textAlign='center';octx.textBaseline='middle';
  octx.fillText('NoCap.',w/2,h/2);
  const img=octx.getImageData(0,0,w,h).data;
  const targets=[];
  const gap=Math.max(5,Math.round(w/210));
  for(let y=0;y<h;y+=gap)for(let x=0;x<w;x+=gap){
   if(img[(y*w+x)*4+3]>128)targets.push([x,y]);
  }
  let seed=42;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
  const P=targets.map(([tx,ty])=>{const a=rnd()*6.28,d=Math.max(w,h)*(0.35+rnd()*0.5);
   return {tx,ty,sx:w/2+Math.cos(a)*d,sy:h/2+Math.sin(a)*d,delay:rnd()*0.3};});
  const start=performance.now();let raf;
  function frame(now){
   const t=(now-start)/1000;
   ctx.clearRect(0,0,w,h);
   for(const p of P){
    const lt=Math.min(1,Math.max(0,(t-p.delay)/1.25));
    const e=1-Math.pow(1-lt,3);
    const cx=p.sx+(p.tx-p.sx)*e,cy=p.sy+(p.ty-p.sy)*e;
    ctx.fillStyle=`rgba(255,138,76,${(0.25+e*0.62).toFixed(3)})`;
    ctx.fillRect(cx,cy,2.1,2.1);
   }
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  const t1=setTimeout(()=>setFade(true),2050);
  const t2=setTimeout(()=>{try{sessionStorage.setItem('sp-intro-seen','1');}catch{} setGone(true);},2550);
  return ()=>{cancelAnimationFrame(raf);clearTimeout(t1);clearTimeout(t2);};
 },[gone]);
 if(gone)return null;
 return <div className={cn('intro-loader',fade&&'fade')} aria-hidden="true"><canvas ref={ref}/></div>;
}

// Cursor spotlight for glass panels (hover.dev / Kokonut UI pattern, hand-built):
// a soft ember glow follows the pointer across any .panel via --mx/--my.
// Disabled under prefers-reduced-motion (the CSS hides the glow there too).
export function Spotlight(){
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  function onMove(e){
   const t=e.target;
   const el=t&&t.closest?t.closest('.panel'):null;
   if(!el)return;
   const r=el.getBoundingClientRect();
   el.style.setProperty('--mx',(e.clientX-r.left)+'px');
   el.style.setProperty('--my',(e.clientY-r.top)+'px');
  }
  window.addEventListener('mousemove',onMove,{passive:true});
  return ()=>window.removeEventListener('mousemove',onMove);
 },[]);
 return null;
}

// Deterministic particle layout so a re-render never reshuffles the field.
function makeParticles(n){
 const out=[];let seed=20261021;
 const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
 for(let i=0;i<n;i++)out.push({x:rnd()*100,size:2+rnd()*3.2,op:.22+rnd()*.26,dur:19+rnd()*17,delay:-rnd()*36,drift:(rnd()*10-5)});
 return out;
}
export function Ambient(){
 const particles=useMemo(()=>makeParticles(22),[]);
 return <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
  <div className="ambient-aurora"/>
  <div className="ambient-glow ambient-glow-a"/>
  <div className="ambient-glow ambient-glow-b"/>
  {particles.map((p,i)=><span key={i} className="ember-particle" style={{'--p-x':p.x+'%','--p-size':p.size.toFixed(1)+'px','--p-op':p.op.toFixed(2),'--p-dur':p.dur.toFixed(1)+'s','--p-delay':p.delay.toFixed(1)+'s','--p-drift':p.drift.toFixed(1)+'vw'}}/>)}
  <div className="ambient-noise"/>
 </div>;
}

// Count-up number (reactbits Count Up): rAF ease-out, jumps straight to the
// final value under prefers-reduced-motion.
export function CountUp({value,decimals=0,duration=950,className}){
 const ref=useRef(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=value.toFixed(decimals);return;}
  let raf;const start=performance.now();
  const tick=t=>{const p=Math.min(1,(t-start)/duration);const e=1-Math.pow(1-p,3);el.textContent=(value*e).toFixed(decimals);if(p<1)raf=requestAnimationFrame(tick);};
  raf=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(raf);
 },[value,decimals,duration]);
 return <span ref={ref} className={className}>{value.toFixed(decimals)}</span>;
}

// Hold-to-confirm button (hover.dev Hold To Confirm, built by hand): press and
// hold ~1s to fire; releasing early cancels. The fill sweeps left to right.
export function HoldButton({onFire,disabled,holdMs=1000,children,hint,className}){
 const [pct,setPct]=useState(0);
 const raf=useRef(null),start=useRef(0),fired=useRef(false);
 function cancel(){if(raf.current)cancelAnimationFrame(raf.current);raf.current=null;setPct(0);}
 function tick(t){
  const p=Math.min(1,(t-start.current)/holdMs);
  setPct(p);
  if(p>=1){raf.current=null;if(!fired.current){fired.current=true;setPct(0);onFire();}return;}
  raf.current=requestAnimationFrame(tick);
 }
 function down(e){
  if(disabled||fired.current)return;
  e.preventDefault();
  start.current=performance.now();
  if(raf.current)cancelAnimationFrame(raf.current);
  raf.current=requestAnimationFrame(tick);
 }
 useEffect(()=>()=>{if(raf.current)cancelAnimationFrame(raf.current);},[]);
 useEffect(()=>{if(!disabled)fired.current=false;},[disabled]);
 return <>
  <button type="button" className={'hold-btn btn-shine'+(className?' '+className:'')} disabled={disabled}
   style={{'--hold':pct}}
   onPointerDown={down} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
   onContextMenu={e=>e.preventDefault()}>
   <span className="hold-ring"><Lock size={11} strokeWidth={3}/></span>
   {children}
  </button>
  {hint&&<span className="hold-hint">{hint}</span>}
 </>;
}
