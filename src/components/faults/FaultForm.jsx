import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus, X, Sparkles } from 'lucide-react';
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

  // Run AI analysis when description loses focus (or location text changes after description is filled)
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {editingFault ? 'עריכת תקלה' : 'תקלה חדשה'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Location - free text */}
            <div className="space-y-2">
              <Label htmlFor="locationText">מיקום *</Label>
              <Input
                id="locationText"
                placeholder="לדוגמה: פנימייה א׳ חדר 112, בניין מדעים כיתה ז5"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                onBlur={runAnalysis}
                required
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
            <div className="space-y-2">
              <Label htmlFor="description">תיאור התקלה *</Label>
              <Textarea
                id="description"
                placeholder="תאר בפירוט את התקלה"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                onBlur={runAnalysis}
                required
                rows={4}
              />
            </div>

            {/* Fault Type - auto-filled by AI, editable */}
            <div className="space-y-2">
              <Label htmlFor="faultType" className="flex items-center gap-1">
                סוג תקלה *
                {analyzing && <span className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" /> מנתח...</span>}
              </Label>
              <Input
                id="faultType"
                placeholder="יסווג אוטומטית לפי התיאור"
                value={formData.faultType}
                onChange={(e) => setFormData(prev => ({ ...prev, faultType: e.target.value }))}
                required
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>תמונה</Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">בחר תמונה</span>
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="hidden" />
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setFormData(prev => ({ ...prev, image: '' })); setImagePreview(''); }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced fields for maintenance manager */}
            {showAdvancedFields && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">עדיפות</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="גבוהה">🔴 גבוהה</SelectItem>
                      <SelectItem value="בינונית">🟡 בינונית</SelectItem>
                      <SelectItem value="לא מוגדר">⚪ לא מוגדר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">משויך ל</Label>
                  <Select value={formData.assignedTo} onValueChange={(value) => {
                    const newData = { ...formData, assignedTo: value };
                    if (!formData.assignedTo && value && formData.status === 'ממתין') newData.status = 'בטיפול';
                    setFormData(newData);
                  }}>
                    <SelectTrigger id="assignedTo"><SelectValue placeholder="בחר עובד" /></SelectTrigger>
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || analyzing} className="gap-2">
                {loading ? 'שומר...' : editingFault ? 'עדכון תקלה' : 'יצירת תקלה'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}