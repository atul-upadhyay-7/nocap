import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {cn} from '@/lib/utils';
const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({className,...props},ref)=>(
 <TabsPrimitive.List ref={ref} className={cn('inline-flex h-11 items-center gap-1 rounded-full border border-[var(--stroke)] bg-[var(--glass-soft)] p-1 backdrop-blur-md',className)} {...props}/>));
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef(({className,...props},ref)=>(
 <TabsPrimitive.Trigger ref={ref} className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[rgb(255_244_236/0.93)] data-[state=active]:text-[#241a12]',className)} {...props}/>));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React.forwardRef(({className,...props},ref)=>(
 <TabsPrimitive.Content ref={ref} className={cn('mt-5 focus-visible:outline-none',className)} {...props}/>));
TabsContent.displayName = TabsPrimitive.Content.displayName;
export {Tabs, TabsList, TabsTrigger, TabsContent};
