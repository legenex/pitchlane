import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Company' },
  { label: 'Website' },
  { label: 'Assets' },
  { label: 'Brand' },
  { label: 'Plan' },
];

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-10 gap-0">
      {STEPS.map((step, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                done && 'bg-primary text-primary-foreground',
                active && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                !done && !active && 'bg-muted text-muted-foreground'
              )}>
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={cn(
                'text-xs mt-1.5 font-medium',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-px w-12 mb-5 transition-colors',
                done ? 'bg-primary' : 'bg-border'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}