import React from 'react';

export default function PageHeader({ icon: IconComponent, title, subtitle }) {
  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        {IconComponent && (
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}