import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, X, Sparkles, MapPin, FileText, Camera, ChevronDown } from 'lucide-react';
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
  const [imagePreview, setImagePreview] = useState(editingFault?.image || '');

  const handleImageUpload = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image: file_url }));
    setImagePreview(file_url);
  };

  const runAnalysis = async () => {
    if (!locationText && !formData.description) return;
    setAnalyzing(true);
    const response = await base44.functions.invoke('analyzeFaultInput', {
      locationText,
      descriptionText: formData.description,
    });
    const result = response.data;
    setFormData(prev => ({
      ...prev,
      location: result.normalizedLocation || locationText,
      roomNumber: result.roomNumber || '',
      faultType: result.faultCategory || prev.faultType,
      title: result.faultTitle || prev.title || '',
    }));
    setAnalyzing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      dataToSave.status = 'ממתין';
      dataToSave.reportedBy = user.email;
      await base44.entities.Fault.create(dataToSave);
    }

    setFormData({ location: '', roomNumber: '', faultType: '', description: '', image: '', priority: 'לא מוגדר', assignedTo: '', status: 'ממתין' });
    setLocationText('');
    setImagePreview('');
    if (onSuccess) onSuccess();
    setLoading(false);
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
              onBlur={runAnalysis}
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
              onBlur={runAnalysis}
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
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, image: '' })); setImagePreview(''); }}
                  className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors gap-2">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-orange-600 font-medium">לחץ להעלאת תמונה</span>
                <span className="text-xs text-muted-foreground">חובה לצרף תמונה של התקלה</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="hidden" />
              </label>
            )}
          </div>

          {/* Advanced fields */}
          {showAdvancedFields && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">עדיפות</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="גבוהה">🔴 גבוהה</SelectItem>
                    <SelectItem value="בינונית">🟡 בינונית</SelectItem>
                    <SelectItem value="לא מוגדר">⚪ לא מוגדר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">משויך ל</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => {
                  const newData = { ...formData, assignedTo: value };
                  if (!formData.assignedTo && value && formData.status === 'ממתין') newData.status = 'בטיפול';
                  setFormData(newData);
                }}>
                  <SelectTrigger><SelectValue placeholder="בחר עובד" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>ללא הקצאה</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
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
              disabled={loading || analyzing || !imagePreview}
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