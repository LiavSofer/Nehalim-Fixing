import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Camera, Upload, Loader2 } from 'lucide-react';

export default function ProfileSetupModal({ onComplete }) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePhone = (p) => /^0[0-9]{8,9}$/.test(p.replace(/-/g, ''));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!displayName.trim()) errs.displayName = 'נא להזין שם מלא';
    if (!phone.trim()) errs.phone = 'נא להזין מספר טלפון';
    else if (!validatePhone(phone)) errs.phone = 'מספר טלפון ישראלי לא תקין';
    if (!profileImage) errs.profileImage = 'נא להעלות תמונת פרופיל';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: profileImage });
    await base44.auth.updateMe({
      displayName: displayName.trim(),
      phone: phone.trim(),
      profileImage: file_url,
      profileCompleted: true,
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8" dir="rtl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">ברוך הבא! 👋</h2>
          <p className="text-muted-foreground mt-1 text-sm">נא למלא את הפרטים לפני שממשיכים</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
              {previewUrl ? (
                <img src={previewUrl} alt="תמונת פרופיל" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg text-sm font-medium cursor-pointer transition-colors border border-primary/20">
                <Camera className="w-4 h-4" />
                צלם
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
              </label>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/70 text-muted-foreground rounded-lg text-sm font-medium cursor-pointer transition-colors border border-border">
                <Upload className="w-4 h-4" />
                גלריה
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            {errors.profileImage && <p className="text-destructive text-xs">{errors.profileImage}</p>}
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="displayName" className="flex items-center gap-1">
              <User className="w-4 h-4" /> שם מלא
            </Label>
            <Input
              id="displayName"
              placeholder="ישראל ישראלי"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className={errors.displayName ? 'border-destructive' : ''}
            />
            {errors.displayName && <p className="text-destructive text-xs">{errors.displayName}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="w-4 h-4" /> מספר פלאפון
            </Label>
            <Input
              id="phone"
              placeholder="050-0000000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={errors.phone ? 'border-destructive' : ''}
              dir="ltr"
            />
            {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'המשך'}
          </Button>
        </form>
      </div>
    </div>
  );
}