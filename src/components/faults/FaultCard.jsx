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
        className="flex flex-row items-start gap-3 p-3 bg-card border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer">

        {/* Image - right side */}
        {fault.image && (
          <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-muted rounded order-last">
            <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Main content - middle */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h3 className="font-bold text-foreground text-sm leading-tight">{fault.faultType}</h3>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-foreground/70 font-medium truncate">{fault.location}</p>
          </div>
          <div className="flex gap-3 mt-1 flex-wrap">
            {!isMadrich && (
              <p className={`text-xs font-semibold ${
                fault.priority === 'גבוהה' ? 'text-red-600' :
                fault.priority === 'בינונית' ? 'text-amber-600' :
                'text-gray-500'
              }`}>{fault.priority}</p>
            )}
            <p className={`text-xs font-semibold ${
              fault.status === 'ממתין' ? 'text-yellow-600' :
              fault.status === 'בטיפול' ? 'text-blue-600' :
              fault.status === 'ממתין לאישור' ? 'text-green-600' :
              'text-green-600'
            }`}>{fault.status}</p>
          </div>
        </div>

        {/* Action buttons - left side */}
        <div className="flex flex-col gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* WhatsApp share */}
          <button
            onClick={(e) => { e.stopPropagation(); shareToWhatsApp(fault); }}
            className="p-1.5 hover:bg-green-50 rounded transition-colors"
            title="שיתוף בוואטסאפ"
          >
            <Share2 className="w-4 h-4 text-green-600" />
          </button>

          {isMaintenanceManager && !assignedUser && (
            <button
              onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
              className="p-1.5 hover:bg-background rounded transition-colors"
              title="שיוך עובד"
            >
              <Wrench className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {isMaintenanceManager && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(fault); }}
              className="p-1.5 hover:bg-background rounded transition-colors"
              title="עריכה"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {isWorkerView && fault.status === 'בטיפול' && (
            <button
              onClick={(e) => { e.stopPropagation(); setRepairDialogOpen(true); }}
              className="p-1.5 hover:bg-green-50 rounded transition-colors"
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