import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wrench, PenLine, CheckCircle2, Share2, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AssignWorkerDialog from './AssignWorkerDialog';
import MarkRepairedDialog from './MarkRepairedDialog';
import FaultDetailDialog from './FaultDetailDialog.jsx';
import PriorityDialog from './PriorityDialog.jsx';

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
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);

  const assignedInitials = assignedUser?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div 
        onClick={() => setDetailDialogOpen(true)}
        className="flex flex-row items-center gap-3 px-3 py-3 bg-card border-b border-sky-200/50 last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer group">

        {/* Image - left side */}
        {fault.image && (
          <div className="w-18 h-18 flex-shrink-0 overflow-hidden bg-muted rounded-xl" style={{width:'72px',height:'72px'}}>
            <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-base md:text-sm leading-snug">{fault.title || fault.faultType}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm md:text-xs text-muted-foreground truncate">
              {fault.location}{fault.roomNumber ? ` - ${fault.roomNumber}` : ''}
            </p>
          </div>
          {fault.description && (
            <p className="text-sm md:text-xs text-muted-foreground mt-0.5 line-clamp-1">{fault.description}</p>
          )}
          <div className="flex gap-1.5 mt-2 flex-wrap items-center">
            {fault.faultType && (
              <span className="text-xs md:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{fault.faultType}</span>
            )}
            {!isMadrich && fault.priority && fault.priority !== 'לא מוגדר' && (
              <span className={`text-xs md:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                fault.priority === 'גבוהה' ? 'bg-red-50 text-red-600' :
                fault.priority === 'נמוכה' ? 'bg-blue-50 text-blue-600' :
                'bg-amber-50 text-amber-600'
              }`}>{fault.priority}</span>
            )}
            <span className={`text-xs md:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              fault.status === 'ממתין' ? 'bg-yellow-50 text-yellow-700' :
              fault.status === 'בטיפול' ? 'bg-blue-50 text-blue-700' :
              fault.status === 'ממתין לאישור' ? 'bg-green-50 text-green-700' :
              'bg-green-50 text-green-700'
            }`}>{fault.status}</span>
            {/* Assigned worker chip */}
            {assignedUser && (
              <span className="flex items-center gap-1 text-xs md:text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                <Avatar className="h-4 w-4 md:h-3.5 md:w-3.5">
                  {assignedUser.profileImage && <AvatarImage src={assignedUser.profileImage} />}
                  <AvatarFallback className="text-[9px] bg-primary/20 text-primary">{assignedInitials}</AvatarFallback>
                </Avatar>
                {assignedUser.full_name?.split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - 2x2 grid for maintenance manager */}
        {isMaintenanceManager ? (
          <div className="grid grid-cols-2 gap-1.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {[
              {
                onClick: (e) => { e.stopPropagation(); setPriorityDialogOpen(true); },
                icon: <Flag fill="currentColor" className={`w-5 h-5 ${
                  fault.priority === 'גבוהה' ? 'text-red-500' :
                  fault.priority === 'בינונית' ? 'text-amber-500' :
                  fault.priority === 'נמוכה' ? 'text-blue-500' :
                  'text-muted-foreground'
                }`} />,
                label: 'דחיפות',
                className: 'hover:bg-amber-50',
              },
              {
                onClick: (e) => { e.stopPropagation(); setDialogOpen(true); },
                icon: <Wrench fill="currentColor" className="w-5 h-5 text-primary" />,
                label: 'שיוך',
                className: 'hover:bg-primary/10',
              },
              {
                onClick: (e) => { e.stopPropagation(); onEdit?.(fault); },
                icon: <PenLine className="w-5 h-5 text-slate-500" strokeWidth={2.5} />,
                label: 'עריכה',
                className: 'hover:bg-muted',
              },
              {
                onClick: (e) => { e.stopPropagation(); shareToWhatsApp(fault); },
                icon: <Share2 fill="currentColor" className="w-5 h-5 text-green-600" />,
                label: 'שיתוף',
                className: 'hover:bg-green-50',
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg transition-colors ${btn.className}`}
              >
                {btn.icon}
                <span className="text-[11px] font-medium text-muted-foreground leading-none">{btn.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); shareToWhatsApp(fault); }}
              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
              title="שיתוף בוואטסאפ"
            >
              <Share2 className="w-4 h-4 text-green-600" />
            </button>
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
        )}
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

      {/* Priority Dialog */}
      <PriorityDialog
        open={priorityDialogOpen}
        onOpenChange={setPriorityDialogOpen}
        fault={fault}
        onSuccess={onAssignmentChange}
      />
    </motion.div>
  );
}