import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Company' },
  { label: 'Website' },
  { label: 'Assets' },
  { label: 'Brand' },
  { label: 'Plan' },
];

export default function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 0 }}>
      {STEPS.map((step, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <React.Fragment key={num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--ink)' : active ? 'var(--accent)' : 'transparent',
                border: done || active ? 'none' : '2px solid var(--line)',
                boxShadow: active ? '0 0 0 4px rgba(242,92,42,0.15)' : 'none',
                transition: 'all 200ms',
              }}>
                {done
                  ? <Check size={13} style={{ color: 'var(--canvas)' }} />
                  : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: active ? '#fff' : 'var(--ink-muted)' }}>{num}</span>
                }
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em',
                color: active ? 'var(--accent)' : done ? 'var(--ink-soft)' : 'var(--ink-muted)'
              }}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 1, width: 40, background: done ? 'var(--ink)' : 'var(--line)', marginBottom: 22, transition: 'background 200ms' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}