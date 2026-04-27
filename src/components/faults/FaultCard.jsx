import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wrench, Edit2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AssignWorkerDialog from './AssignWorkerDialog';
import MarkRepairedDialog from './MarkRepairedDialog';
import FaultDetailDialog from './FaultDetailDialog.jsx';

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

export default function FaultCard({ fault, assignedUser, reportedUser, isMaintenanceManager, onEdit, users = [], onAssignmentChange, isWorkerView = false }) {
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
        className="flex flex-col md:flex-row md:items-center gap-3 p-2 md:p-3 bg-card border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer">
        {/* Image */}
        {fault.image && (
          <div className="w-full md:w-20 h-16 md:h-20 flex-shrink-0 overflow-hidden bg-muted rounded">
            <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 md:gap-4">
          {/* Type and Location */}
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-base md:text-lg">{fault.faultType}</h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-foreground/70 font-medium truncate">{fault.location}</p>
            </div>
          </div>

          {/* Priority and Status */}
          <div className="flex gap-6 flex-wrap">
            <div className="flex flex-col min-w-fit">
              <span className="text-xs text-muted-foreground mb-1">דחיפות</span>
              <p className={`text-sm font-semibold ${
                fault.priority === 'גבוהה' ? 'text-red-600' :
                fault.priority === 'בינונית' ? 'text-amber-600' :
                'text-gray-600'
              }`}>
                {fault.priority}
              </p>
            </div>

            <div className="flex flex-col min-w-fit">
              <span className="text-xs text-muted-foreground mb-1">סטטוס</span>
              <p className={`text-sm font-semibold ${
                fault.status === 'ממתין' ? 'text-yellow-600' :
                fault.status === 'בטיפול' ? 'text-blue-600' :
                fault.status === 'ממתין לאישור' ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {fault.status}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 md:gap-2 flex-shrink-0 self-start md:self-auto" onClick={(e) => e.stopPropagation()}>
          {isMaintenanceManager && !assignedUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="text-xs px-2 md:px-3 gap-1"
            >
              <Wrench className="w-3 h-3" />
              <span>שיוך עובד</span>
            </Button>
          )}

          {isMaintenanceManager && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(fault);
              }}
              className="p-1 hover:bg-background rounded transition-colors"
              title="עריכה"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {isWorkerView && fault.status === 'בטיפול' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRepairDialogOpen(true)}
              className="text-xs px-2 md:px-3 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <CheckCircle2 className="w-3 h-3 md:ml-1" />
              <span className="hidden md:inline">סימון</span>
            </Button>
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