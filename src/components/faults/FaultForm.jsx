import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FaultForm({ users, onSuccess, editingFault = null, showAdvancedFields = false }) {
  const [formData, setFormData] = useState(editingFault || {
    location: '',
    faultType: '',
    description: '',
    image: '',
    priority: 'לא מוגדר',
    assignedTo: '',
    status: 'ממתין',
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(editingFault?.image || '');

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image: file_url }));
      setImagePreview(file_url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await base44.auth.me();
      let dataToSave = { ...formData };

      if (editingFault) {
        // When editing, check if assignedTo changed
        const wasUnassigned = !editingFault.assignedTo;
        const nowAssigned = formData.assignedTo;
        
        // Auto-update status: if assigning to someone for first time, set to "בטיפול"
        if (wasUnassigned && nowAssigned && formData.status === 'ממתין') {
          dataToSave.status = 'בטיפול';
        }
        
        await base44.entities.Fault.update(editingFault.id, dataToSave);
      } else {
        // New fault always starts with "ממתין"
        dataToSave.status = 'ממתין';
        dataToSave.reportedBy = user.email;
        await base44.entities.Fault.create(dataToSave);
      }

      setFormData({
        location: '',
        faultType: '',
        description: '',
        image: '',
        priority: 'לא מוגדר',
        assignedTo: '',
        status: 'ממתין',
      });
      setImagePreview('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Fault operation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            תקלה חדשה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">מיקום *</Label>
              <Input
                id="location"
                placeholder="לדוגמה: חדר מכונות, קומה 3"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            {/* Fault Type */}
            <div className="space-y-2">
              <Label htmlFor="faultType">סוג תקלה *</Label>
              <Input
                id="faultType"
                placeholder="לדוגמה: דזימה, רעש חריג"
                value={formData.faultType}
                onChange={(e) => setFormData(prev => ({ ...prev, faultType: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">תיאור מפורט *</Label>
              <Textarea
                id="description"
                placeholder="תאר בפירוט את התקלה, המצב הנוכחי והשפעתה"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, image: '' }));
                        setImagePreview('');
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced fields for maintenance manager */}
            {showAdvancedFields && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">סטטוס</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ממתין">ממתין</SelectItem>
                      <SelectItem value="בטיפול">בטיפול</SelectItem>
                      <SelectItem value="ממתין לאישור">ממתין לאישור</SelectItem>
                      <SelectItem value="סגור">סגור</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">עדיפות</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="גבוהה">🔴 גבוהה</SelectItem>
                      <SelectItem value="בינונית">🟡 בינונית</SelectItem>
                      <SelectItem value="נמוכה">🔵 נמוכה</SelectItem>
                      <SelectItem value="לא מוגדר">⚪ לא מוגדר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">משויך ל</Label>
                  <Select 
                    value={formData.assignedTo} 
                    onValueChange={(value) => {
                      const newData = { ...formData, assignedTo: value };
                      // Auto-set status to "בטיפול" when assigning
                      if (!formData.assignedTo && value && formData.status === 'ממתין') {
                        newData.status = 'בטיפול';
                      }
                      setFormData(newData);
                    }}
                  >
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder="בחר עובד" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>ללא הקצאה</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? 'שומר...' : editingFault ? 'עדכון תקלה' : 'יצירת תקלה'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}