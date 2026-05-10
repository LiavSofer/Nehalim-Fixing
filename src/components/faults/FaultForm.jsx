import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { uploadFile } from '@/lib/uploadFile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Sparkles, MapPin, FileText, Camera, ImagePlus, ArrowBigUp, ArrowBigDown, Minus, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FaultForm({ users, onSuccess, editingFault = null, showAdvancedFields = false }) {
  const [formData, setFormData] = useState(editingFault || {
    location: '',
    roomNumber: '',
    faultType: '',
    description: '',
    image: '',
    priority: 'לא מוגדר',
    assignedTo: '',
    status: 'ממתין',
  });
  const [locationText, setLocationText] = useState(editingFault?.location || '');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(editingFault?.image || '');
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const uploadedUrlRef = useRef(editingFault?.image || '');
  const focusedElementRef = useRef(null);

  const compressImage = (file) => new Promise((resolve, reject) => {
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
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('שגיאה בדחיסת תמונה'));
      }, 'image/jpeg', 0.70);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('שגיאה בטעינת תמונה')); };
    img.src = url;
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Take a local object URL immediately so preview shows right away
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fileToUpload = new File([compressed], file.name || 'image.jpg', { type: 'image/jpeg' });
      const { file_url } = await uploadFile(fileToUpload);
      URL.revokeObjectURL(localPreview);
      uploadedUrlRef.current = file_url;
      setFormData(prev => ({ ...prev, image: file_url }));
      setImagePreview(file_url);
    } catch (err) {
      console.error('שגיאה בהעלאת תמונה:', err);
      URL.revokeObjectURL(localPreview);
      setImagePreview('');
      uploadedUrlRef.current = '';
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runAnalysis = async (locText, descText) => {
    const loc = locText !== undefined ? locText : locationText;
    const desc = descText !== undefined ? descText : formData.description;
    if (!loc && !desc) return;
    // שמור את האלמנט הממוקד לפני הניתוח
    focusedElementRef.current = document.activeElement;
    setAnalyzing(true);
    const response = await base44.functions.invoke('analyzeFaultInput', {
      locationText: loc,
      descriptionText: desc,
    });
    const result = response.data;
    setFormData(prev => ({
      ...prev,
      location: result.normalizedLocation || loc,
      roomNumber: result.roomNumber || '',
      faultType: result.faultCategory || prev.faultType,
      title: result.faultTitle || prev.title || '',
    }));
    setAnalyzing(false);
    // החזר פוקוס לאלמנט שהיה פעיל לפני הניתוח
    if (focusedElementRef.current && document.body.contains(focusedElementRef.current)) {
      focusedElementRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await base44.auth.me();
      let dataToSave = { ...formData };

      if (editingFault) {
        const wasUnassigned = !editingFault.assignedTo;
        const nowAssigned = formData.assignedTo;
        if (wasUnassigned && nowAssigned && formData.status === 'ממתין') {
          dataToSave.status = 'בטיפול';
        }
        await base44.entities.Fault.update(editingFault.id, dataToSave);
      } else {
        const response = await base44.functions.invoke('createFault', dataToSave);
        if (response.data?.error) throw new Error(response.data.error);
      }

      setFormData({ location: '', roomNumber: '', faultType: '', description: '', image: '', priority: 'לא מוגדר', assignedTo: '', status: 'ממתין' });
      setLocationText('');
      setImagePreview('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('שגיאה בשמירת תקלה:', err);
      alert('שגיאה בשמירת התקלה: ' + (err.message || 'אנא נסה שוב'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">

        {/* Header */}
        <div className="bg-primary/5 border-b px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {editingFault ? '✏️ עריכת תקלה' : '🔧 דיווח תקלה חדשה'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">מלא את הפרטים ו-AI ינתח את המידע אוטומטית</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              מיקום *
            </Label>
            <Input
              placeholder='לדוגמה: פנימייה א׳ חדר 112'
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              onBlur={() => runAnalysis()}
              required
              className="text-right"
            />
            {formData.location && formData.location !== locationText && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                זוהה: <strong>{formData.location}</strong>
                {formData.roomNumber && <span> · חדר/כיתה: <strong>{formData.roomNumber}</strong></span>}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <FileText className="w-3.5 h-3.5 text-primary" />
              תיאור התקלה *
              {analyzing && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 mr-auto font-normal">
                  <Sparkles className="w-3 h-3 animate-pulse text-primary" />
                  מנתח...
                </span>
              )}
            </Label>
            <Textarea
              placeholder="תאר בפירוט את התקלה – מה קרה, מתי, ומה ניסית לעשות"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onBlur={() => runAnalysis()}
              required
              rows={3}
              className="text-right resize-none"
            />
            {formData.faultType && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                סוג תקלה שזוהה: <strong>{formData.faultType}</strong>
              </p>
            )}
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Camera className="w-3.5 h-3.5 text-primary" />
              תמונה *
            </Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-white font-medium">מעלה תמונה...</span>
                  </div>
                )}
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => { uploadedUrlRef.current = ''; setFormData(prev => ({ ...prev, image: '' })); setImagePreview(''); }}
                    className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {/* צילום תמונה - משקל 3 */}
                <label className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors" style={{ flex: 3 }}>
                  <Camera className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-orange-600 font-semibold">צילום תמונה</span>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>
                {/* העלאה מגלריה - משקל 1 */}
                <label className="flex items-center justify-center gap-2 py-2.5 border border-dashed border-muted-foreground/40 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors" style={{ flex: 1 }}>
                  <ImagePlus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">הוספה מגלריה</span>
                  <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Advanced fields */}
          {showAdvancedFields && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">עדיפות</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="text-right">
                    <SelectItem value="גבוהה">
                      <span className="flex items-center gap-1.5"><ArrowBigUp className="w-4 h-4 text-red-500" /> גבוהה</span>
                    </SelectItem>
                    <SelectItem value="בינונית">
                      <span className="flex items-center gap-1.5"><Minus className="w-4 h-4 text-orange-400" /> בינונית</span>
                    </SelectItem>
                    <SelectItem value="נמוכה">
                      <span className="flex items-center gap-1.5"><ArrowBigDown className="w-4 h-4 text-green-500" /> נמוכה</span>
                    </SelectItem>
                    <SelectItem value="לא מוגדר">
                      <span className="flex items-center gap-1.5"><Circle className="w-4 h-4 text-muted-foreground" /> לא מוגדר</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">משויך ל</Label>
                <Select value={formData.assignedTo || "__none__"} onValueChange={(value) => {
                const assignedValue = value === "__none__" ? "" : value;
                const newData = { ...formData, assignedTo: assignedValue };
                if (!formData.assignedTo && assignedValue && formData.status === 'ממתין') newData.status = 'בטיפול';
                setFormData(newData);
                }}>
                 <SelectTrigger dir="rtl"><SelectValue placeholder="בחר עובד" /></SelectTrigger>
                 <SelectContent className="text-right">
                    <SelectItem value="__none__">ללא הקצאה</SelectItem>
                    {users.filter(u => u.userType === 'אב בית').map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2 w-full flex-row-reverse justify-end">
                          <span>{user.full_name}</span>
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.full_name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                              {user.full_name?.[0] || '?'}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <Button
              type="submit"
              disabled={loading || analyzing || uploading || !imagePreview || !uploadedUrlRef.current}
              className="w-full h-10 text-sm font-semibold rounded-xl"
            >
              {loading ? 'שומר...' : analyzing ? 'ממתין לניתוח AI...' : editingFault ? 'עדכון תקלה' : 'שליחת דיווח'}
            </Button>
          </div>

        </form>
      </div>
    </motion.div>
  );
}