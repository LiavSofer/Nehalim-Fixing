import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wrench, Edit2, CheckCircle2, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AssignWorkerDialog from './AssignWorkerDialog';
import MarkRepairedDialog from './MarkRepairedDialog';
import FaultDetailDialog from './FaultDetailDialog.jsx';

const shareToWhatsApp = (fault) => {
  const text = `*תקלה: ${fault.faultType}*\n📍 מיקום: ${fault.location}\n📝 תיאור: ${fault.description || ''}\n🔴 דחיפות: ${fault.priority}\n📌 סטטוס: ${fault.status}${fault.image ? `\n🖼️ תמונה: ${fault.image}` : ''}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const STATUS_COLORS = {
  'ממתין': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'בטיפול': 'bg-blue-100 text-blue-800 border-blue-200',
  'ממתין לאישור': 'bg-orange-100 text-orange-800 border-orange-200',
  'סגור': 'bg-green-100 text-green-800 border-green-200',
};

const PRIORITY_COLORS = {
  'גבוהה': 'bg-red-100 text-red-800 border-red-200',
  'בינונית': 'bg-amber-100 text-amber-800 border-amber-200',
  'לא מוגדר': 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function FaultCard({ fault, assignedUser, reportedUser, isMaintenanceManager, isMadrich, onEdit, users = [], onAssignmentChange, isWorkerView = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div 
        onClick={() => setDetailDialogOpen(true)}
        className="flex flex-row items-center gap-3 px-4 py-3 bg-card border-b last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer group">

        {/* Image - right side */}
        {fault.image && (
          <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-muted rounded-xl order-last">
            <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-snug">{fault.faultType}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {fault.location}{fault.roomNumber ? ` · חדר/כיתה ${fault.roomNumber}` : ''}
            </p>
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap items-center">
            {!isMadrich && fault.priority && fault.priority !== 'לא מוגדר' && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                fault.priority === 'גבוהה' ? 'bg-red-50 text-red-600' :
                'bg-amber-50 text-amber-600'
              }`}>{fault.priority}</span>
            )}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              fault.status === 'ממתין' ? 'bg-yellow-50 text-yellow-700' :
              fault.status === 'בטיפול' ? 'bg-blue-50 text-blue-700' :
              fault.status === 'ממתין לאישור' ? 'bg-green-50 text-green-700' :
              'bg-green-50 text-green-700'
            }`}>{fault.status}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); shareToWhatsApp(fault); }}
            className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
            title="שיתוף בוואטסאפ"
          >
            <Share2 className="w-4 h-4 text-green-600" />
          </button>

          {isMaintenanceManager && !assignedUser && (
            <button
              onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
              className="px-2.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
              title="שיוך עובד"
            >
              <Wrench className="w-3.5 h-3.5" />
              שיוך
            </button>
          )}

          {isMaintenanceManager && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(fault); }}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              title="עריכה"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {isWorkerView && fault.status === 'בטיפול' && (
            <button
              onClick={(e) => { e.stopPropagation(); setRepairDialogOpen(true); }}
              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
              title="סימון כטופל"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </button>
          )}
        </div>
      </div>

      {/* Fault Detail Dialog */}
      <FaultDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        fault={fault}
      />

      {/* Assign Worker Dialog */}
      <AssignWorkerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fault={fault}
        users={users}
        onAssignmentChange={onAssignmentChange}
      />

      {/* Mark Repaired Dialog */}
      <MarkRepairedDialog
        open={repairDialogOpen}
        onOpenChange={setRepairDialogOpen}
        fault={fault}
        onSuccess={onAssignmentChange}
      />
    </motion.div>
  );
}