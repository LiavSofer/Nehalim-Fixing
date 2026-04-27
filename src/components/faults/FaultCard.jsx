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
        className="flex items-center gap-3 p-3 bg-card border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer">
        {/* Image */}
        {fault.image && (
          <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-muted">
            <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex items-center gap-8">
          {/* Type and Location */}
          <div className="min-w-0 flex-shrink-0">
            <h3 className="font-semibold text-foreground text-sm truncate">{fault.faultType}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{fault.location}</p>
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1">דחיפות</span>
            <p className={`text-sm font-semibold ${
              fault.priority === 'גבוהה' ? 'text-red-600' :
              fault.priority === 'בינונית' ? 'text-amber-600' :
              'text-gray-600'
            }`}>
              {fault.priority}
            </p>
          </div>

          {/* Status */}
          <div className="flex flex-col items-center">
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

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {isMaintenanceManager && !assignedUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="text-xs"
            >
              <Wrench className="w-3 h-3 ml-1" />
              שיוך
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
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <CheckCircle2 className="w-3 h-3 ml-1" />
              סימון
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