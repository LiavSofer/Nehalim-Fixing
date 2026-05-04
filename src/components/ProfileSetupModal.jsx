import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Camera, Loader2 } from 'lucide-react';

export default function ProfileSetupModal({ onComplete }) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePhone = (p) => /^0[0-9]{8,9}$/.test(p.replace(/-/g, ''));

  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    img.src = url;
  });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    setPreviewUrl(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    setProfileImage(compressed);
    setUploadingImage(false);
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
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg text-sm font-medium cursor-pointer transition-colors border border-primary/20">
              {uploadingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  מכין תמונה...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  צלם / העלה תמונה
                </>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
            </label>
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