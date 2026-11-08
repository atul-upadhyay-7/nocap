import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const buttonVariants = cva(
 "ripple-host inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
 {variants:{
  variant:{
   default:'btn-shine bg-primary text-primary-foreground shadow-[0_8px_22px_-8px_rgb(255_106_47/0.55)] hover:bg-ember-deep',
   destructive:'bg-destructive text-destructive-foreground hover:opacity-90',
   outline:'border border-input bg-transparent backdrop-blur-sm hover:border-foreground',
   secondary:'bg-secondary text-secondary-foreground hover:bg-accent',
   ghost:'hover:bg-accent hover:text-accent-foreground',
   link:'text-ember-deep underline-offset-4 hover:underline',
  },
  size:{default:'h-11 px-5',sm:'h-9 rounded-xl px-3 text-xs',lg:'h-12 rounded-md px-8',icon:'h-9 w-9'},
 },defaultVariants:{variant:'default',size:'default'}});

// Eldora UI-style click ripple: a soft circle blooms from the press point.
// Skipped under prefers-reduced-motion (the CSS hides it there too).
function spawnRipple(e){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const host=e.currentTarget;if(!host||!host.appendChild)return;
 const r=host.getBoundingClientRect();
 const d=Math.max(r.width,r.height)*2;
 const s=document.createElement('span');
 s.className='click-ripple';
 s.style.width=s.style.height=d+'px';
 s.style.left=((e.clientX||r.left+r.width/2)-r.left-d/2)+'px';
 s.style.top=((e.clientY||r.top+r.height/2)-r.top-d/2)+'px';
 host.appendChild(s);
 setTimeout(()=>s.remove(),650);
}

const Button = React.forwardRef(({className,variant,size,asChild=false,onPointerDown,...props},ref)=>{
 const Comp = asChild ? Slot : 'button';
 return <Comp className={cn(buttonVariants({variant,size,className}))} ref={ref}
  onPointerDown={e=>{onPointerDown&&onPointerDown(e);spawnRipple(e);}} {...props}/>;
});
Button.displayName = 'Button';
export {Button, buttonVariants};
