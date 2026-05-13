import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCircle2, Loader2, BellRing } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function NotificationSettings({ user }) {
  const [prefs, setPrefs] = useState(null);
  const [prefsId, setPrefsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const userRole = user?.role || user?.userType;

  const defaultPrefs = {
    notifyTaskAssigned: true,
    notifyAwaitingApproval: true,
    notifyFaultClosed: true,
    notifyNewFault: true,
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const existing = await base44.entities.NotificationPreferences.filter({ userId: user.id });
      if (existing.length > 0) {
        setPrefs(existing[0]);
        setPrefsId(existing[0].id);
      } else {
        setPrefs({ ...defaultPrefs, userId: user.id, userEmail: user.email });
      }
    } catch {
      setPrefs({ ...defaultPrefs, userId: user.id, userEmail: user.email });
    }
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      if (prefsId) {
        await base44.entities.NotificationPreferences.update(prefsId, prefs);
      } else {
        const created = await base44.entities.NotificationPreferences.create(prefs);
        setPrefsId(created.id);
      }
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (err) {
      console.error('Save prefs error:', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // התיקון לכפתור: שימוש בפונקציה המובנית לבקשת הרשאה (Native)
  const triggerOneSignalPrompt = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.Notifications.requestPermission();
      } catch (err) {
        console.error("Failed to request push permission", err);
      }
    });
  };

  if (!prefs) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  // Build notification options per role
  const notifOptions = [
    {
      key: 'notifyTaskAssigned',
      label: 'משימה הוקצתה אליי',
      desc: 'כאשר מנהל מקצה לי תקלה לטיפול',
      roles: ['אב בית'],
    },
    {
      key: 'notifyAwaitingApproval',
      label: 'ממתין לאישורי',
      desc: 'כאשר אב בית מסמן תקלה כ"ממתין לאישור"',
      roles: ['מנהל אחזקה'],
    },
    {
      key: 'notifyNewFault',
      label: 'תקלה חדשה דווחה',
      desc: 'כאשר משתמש מדווח על תקלה חדשה',
      roles: ['מנהל אחזקה'],
    },
    {
      key: 'notifyFaultClosed',
      label: 'התקלה שלי נסגרה',
      desc: 'כאשר תקלה שדיווחתי עליה נסגרת',
      roles: ['צוות מדווח', 'מנהל אחזקה', 'מפתח'],
    },
  ];

  const relevantOptions = notifOptions.filter(o => o.roles.includes(userRole));

  return (
    <div className="space-y-6" dir="rtl">

      <div className="bg-card border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">התראות דפדפן ומכשיר</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          כדי לקבל התראות גם כשהאפליקציה סגורה, ודא שהמכשיר שלך מאשר קבלת התראות מהאתר.
        </p>
        <Button onClick={triggerOneSignalPrompt} variant="outline" className="gap-2 w-full sm:w-auto mt-2">
          <BellRing className="w-4 h-4" />
          בקש הרשאת התראות
        </Button>
      </div>

      {relevantOptions.length > 0 && (
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-base">אילו התראות תרצה לקבל?</h3>
          <div className="space-y-4">
            {relevantOptions.map(opt => (
              <div key={opt.key} className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium">{opt.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
                <Switch
                  checked={!!prefs[opt.key]}
                  onCheckedChange={() => togglePref(opt.key)}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t mt-4">
            <Button onClick={savePrefs} disabled={saving} size="sm" className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              שמור הגדרות
            </Button>
            {savedMsg && (
              <span className="text-sm text-green-600 flex items-center gap-1 transition-all">
                <CheckCircle2 className="w-4 h-4" /> נשמר בהצלחה
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}