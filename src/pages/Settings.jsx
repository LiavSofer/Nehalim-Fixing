import React, { useState } from 'react';
import { Settings, MapPin, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import LocationSettings from '@/components/settings/LocationSettings';
import FaultCategorySettings from '@/components/settings/FaultCategorySettings';

const TABS = [
  { id: 'locations', label: 'מיקומים', icon: MapPin },
  { id: 'categories', label: 'קטגוריות תקלות', icon: Wrench },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('locations');

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">הגדרות</h1>
            <p className="text-xs text-muted-foreground">ניהול רשימות המערכת</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'locations' && <LocationSettings />}
      {activeTab === 'categories' && <FaultCategorySettings />}
    </div>
  );
}