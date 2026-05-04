import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, BellOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const VAPID_PUBLIC_KEY = 'BEp_b0JJG7-HbuFT_x79GWS26Ydr4Uc5XAiNWqN2WwP8bHGIbXzSNhNEhbVjjSZNFJr-yd7KhVEQjVtOCgFOLIk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationSettings({ user }) {
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [prefsId, setPrefsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const userRole = user?.role;

  const defaultPrefs = {
    notifyTaskAssigned: true,
    notifyAwaitingApproval: true,
    notifyFaultClosed: true,
    notifyNewFault: true,
  };

  useEffect(() => {
    checkSubscription();
    loadPrefs();
  }, []);

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {}
  };

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

  const requestPermissionAndSubscribe = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await base44.functions.invoke('registerPushSubscription', {
        endpoint: sub.endpoint,
        auth: sub.getKey('auth') ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')))) : '',
        p256dh: sub.getKey('p256dh') ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')))) : '',
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error('Subscribe error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const unsubscribe = async () => {
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe error:', err);
    } finally {
      setSubscribing(false);
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

  if (!prefs) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const notSupported = !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window);

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
      label: 'תקלה חדשה נדווחה',
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

      {/* Push permission block */}
      <div className="bg-card border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">הרשאת התראות</h3>
        </div>

        {notSupported ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
            <BellOff className="w-4 h-4 flex-shrink-0" />
            <span>הדפדפן שלך לא תומך בהתראות פוש</span>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="flex items-start gap-2 text-sm bg-destructive/10 text-destructive rounded-xl px-4 py-3">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>חסמת התראות בדפדפן. כדי להפעיל - לך להגדרות הדפדפן ← הרשאות אתר ← אפשר התראות.</span>
          </div>
        ) : isSubscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>התראות פעילות במכשיר זה</span>
            </div>
            <Button variant="outline" size="sm" onClick={unsubscribe} disabled={subscribing} className="text-destructive border-destructive/30 hover:bg-destructive/10">
              {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4 ml-1" />}
              בטל התראות במכשיר זה
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              אפשר התראות פוש כדי לקבל עדכונים בזמן אמת גם כשהאפליקציה סגורה.
            </p>
            <Button onClick={requestPermissionAndSubscribe} disabled={subscribing} className="gap-2">
              {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              הפעל התראות
            </Button>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      {relevantOptions.length > 0 && (
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-base">סוגי התראות</h3>
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

          <div className="flex items-center gap-3 pt-2 border-t">
            <Button onClick={savePrefs} disabled={saving} size="sm" className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              שמור הגדרות
            </Button>
            {savedMsg && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> נשמר בהצלחה
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}