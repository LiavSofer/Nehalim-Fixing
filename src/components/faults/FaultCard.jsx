import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MapPin, Wrench, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';

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

export default function FaultCard({ fault, assignedUser, reportedUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="border overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{fault.faultType}</h3>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">{fault.location}</p>
              </div>
            </div>
            <Badge className={`${STATUS_COLORS[fault.status]} border text-xs flex-shrink-0`}>
              {fault.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Image */}
          {fault.image && (
            <div className="w-full h-40 rounded-lg overflow-hidden bg-muted">
              <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{fault.description}</p>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <Badge variant="outline" className={`${PRIORITY_COLORS[fault.priority]} border text-xs px-1.5`}>
                {fault.priority}
              </Badge>
            </div>

            {assignedUser && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{assignedUser.full_name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{format(new Date(fault.created_date), 'dd.MM.yyyy HH:mm', { locale: he })}</span>
            </div>

            {reportedUser && (
              <div className="col-span-2 text-xs text-muted-foreground">
                דיווח על ידי: <span className="font-medium">{reportedUser.full_name || fault.reportedBy}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}