import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, X, Sparkles, MapPin, FileText, Camera, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState(''); // 'recording' | 'processing' | ''
  const recognitionRef = useRef(null);

  const handleImageUpload = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image: file_url }));
    setImagePreview(file_url);
  };

  const runAnalysis = async (locText, descText) => {
    const loc = locText !== undefined ? locText : locationText;
    const desc = descText !== undefined ? descText : formData.description;
    if (!loc && !desc) return;
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
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('הדפדפן שלך אינו תומך בהקלטה קולית. נסה Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingStatus('recording');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      setRecordingStatus('processing');

      // Send raw transcript directly to analyzeFaultInput — it handles everything
      const response = await base44.functions.invoke('analyzeFaultInput', {
        rawText: transcript,
      });
      const result = response.data;

      if (result.normalizedLocation) setLocationText(result.normalizedLocation);
      setFormData(prev => ({
        ...prev,
        location: result.normalizedLocation || prev.location,
        roomNumber: result.roomNumber || prev.roomNumber,
        description: result.description || prev.description,
        faultType: result.faultCategory || prev.faultType,
        title: result.faultTitle || prev.title,
      }));

      setRecordingStatus('');
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setRecordingStatus('');
    };

    recognition.onend = () => {
      if (isRecording) {
        setIsRecording(false);
        setRecordingStatus('');
      }
    };

    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setRecordingStatus('');
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

          {/* Voice input button */}
          {!editingFault && (
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                {recordingStatus === 'processing' ? (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium px-3 py-1.5 bg-primary/8 rounded-full border border-primary/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    מעבד...
                  </motion.div>
                ) : isRecording ? (
                  <motion.button key="stop" type="button" onClick={stopVoiceInput}
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-medium transition-colors"
                  >
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <MicOff className="w-3.5 h-3.5" />
                    </motion.span>
                    מקליט...
                  </motion.button>
                ) : (
                  <motion.button key="start" type="button" onClick={startVoiceInput}
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-full text-xs font-medium transition-colors border border-primary/20"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    דיווח קולי
                  </motion.button>
                )}
              </AnimatePresence>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">או מלא ידנית</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

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
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, image: '' })); setImagePreview(''); }}
                  className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <label className="flex flex-1 flex-col items-center justify-center py-5 border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors gap-1.5">
                  <Camera className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-orange-600 font-medium">צלם תמונה</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="hidden" />
                </label>
                <label className="flex flex-1 flex-col items-center justify-center py-5 border-2 border-dashed border-border bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors gap-1.5">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">מהגלריה</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="hidden" />
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