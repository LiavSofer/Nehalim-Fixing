import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';

const ROLES = ['ללא הרשאה', 'צוות מדווח', 'אב בית', 'מנהל אחזקה', 'מפתח'];

const ROLE_COLORS = {
  'ללא הרשאה': 'bg-muted text-muted-foreground',
  'צוות מדווח': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'אב בית': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  'מנהל אחזקה': 'bg-primary/10 text-primary border-primary/20',
  'מפתח': 'bg-chart-5/10 text-chart-5 border-chart-5/20',
};

export default function UserRoleEditor({ user, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleRoleChange = async (newRole) => {
    setSaving(true);
    setSaved(false);
    await base44.entities.User.update(user.id, { role: newRole });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="flex items-center gap-3">
      <Select defaultValue={user.role || 'ללא הרשאה'} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-40 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map(role => (
            <SelectItem key={role} value={role}>
              <span className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs px-2 py-0 ${ROLE_COLORS[role]}`}>
                  {role}
                </Badge>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      {saved && <Check className="w-4 h-4 text-chart-2" />}
    </div>
  );
}