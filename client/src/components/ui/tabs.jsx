import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {cn} from '@/lib/utils';
const Tabs = TabsPrimitive.Root;

// SmoothUI-style sliding pill: one glider element behind the triggers,
// repositioned to the active tab whenever data-state flips.
const TabsList = React.forwardRef(({className,...props},ref)=>{
 const inner=React.useRef(null);
 const setRefs=el=>{inner.current=el;if(typeof ref==='function')ref(el);else if(ref)ref.current=el;};
 React.useLayoutEffect(()=>{
  const list=inner.current;if(!list)return;
  const place=()=>{
   const act=list.querySelector('[data-state="active"]');
   if(!act)return;
   list.style.setProperty('--gl-x',act.offsetLeft+'px');
   list.style.setProperty('--gl-w',act.offsetWidth+'px');
   list.classList.add('gl-ready');
  };
  place();
  const mo=new MutationObserver(place);
  mo.observe(list,{attributes:true,subtree:true,attributeFilter:['data-state']});
  window.addEventListener('resize',place);
  return ()=>{mo.disconnect();window.removeEventListener('resize',place);};
 },[]);
 return <TabsPrimitive.List ref={setRefs} className={cn('tabs-list inline-flex h-11 items-center gap-1 rounded-full border border-[var(--stroke)] bg-[var(--glass-soft)] p-1 backdrop-blur-md',className)} {...props}>
  <span className="tab-glider" aria-hidden="true"/>
  {props.children}
 </TabsPrimitive.List>;
});
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef(({className,...props},ref)=>(
 <TabsPrimitive.Trigger ref={ref} className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-[#241a12]',className)} {...props}/>));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React.forwardRef(({className,...props},ref)=>(
 <TabsPrimitive.Content ref={ref} className={cn('mt-5 focus-visible:outline-none',className)} {...props}/>));
TabsContent.displayName = TabsPrimitive.Content.displayName;
export {Tabs, TabsList, TabsTrigger, TabsContent};
