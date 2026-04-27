import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MapPin, Wrench, User, Calendar, Edit2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AssignWorkerDialog from './AssignWorkerDialog';
import MarkRepairedDialog from './MarkRepairedDialog';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="border overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardContent className="flex items-center gap-3 p-3">
          {/* Left section - Title and location */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{fault.faultType}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{fault.location}</p>
            </div>
          </div>

          {/* Middle section - Priority and date */}
          <div className="flex items-center gap-3 text-xs flex-shrink-0">
            <div className="flex items-center gap-1 text-muted-foreground">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <Badge variant="outline" className={`${PRIORITY_COLORS[fault.priority]} border text-xs px-1 py-0`}>
                {fault.priority}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{format(new Date(fault.created_date), 'dd.MM', { locale: he })}</span>
            </div>
          </div>

          {/* Right section - Status and actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge className={`${STATUS_COLORS[fault.status]} border text-xs`}>
              {fault.status}
            </Badge>
            {isMaintenanceManager && (
              <button
                onClick={() => onEdit?.(fault)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
                title="עריכה"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Quick assign section for maintenance manager */}
          {isMaintenanceManager && !assignedUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="text-xs h-7 px-2"
            >
              <Wrench className="w-3 h-3 ml-1" />
              שיוך
            </Button>
          )}

          {/* Mark as repaired button for worker */}
          {isWorkerView && fault.status === 'בטיפול' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRepairDialogOpen(true)}
              className="text-xs h-7 px-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <CheckCircle2 className="w-3 h-3 ml-1" />
              טופל
            </Button>
          )}
        </CardContent>

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
      </Card>
    </motion.div>
  );
}