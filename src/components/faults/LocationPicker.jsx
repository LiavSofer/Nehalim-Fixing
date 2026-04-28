import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Derive dormitory room range from name using gematria order (א=1→100-199, ב=2→200-299, etc.)
const HEBREW_LETTER_ORDER = 'אבגדהוזחטיכלמנסעפצקרשת';

function getDormRange(locationName) {
  // Extract the hebrew letter from the name (e.g. "פנימייה א'" → "א")
  for (let i = 0; i < HEBREW_LETTER_ORDER.length; i++) {
    if (locationName.includes(HEBREW_LETTER_ORDER[i])) {
      const base = (i + 1) * 100;
      return { min: base, max: base + 99 };
    }
  }
  return { min: 100, max: 999 };
}

export default function LocationPicker({ value, onChange }) {
  // value is the full location string, e.g. "פנימייה ב' - חדר 230" or "בניין כיתות - ז5"
  const [selectedLocation, setSelectedLocation] = useState('');
  const [subValue, setSubValue] = useState('');
  const [subError, setSubError] = useState('');

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('order'),
  });

  // Parse initial value back to parts
  useEffect(() => {
    if (value && locations.length > 0) {
      const loc = locations.find(l => value.startsWith(l.name));
      if (loc) {
        setSelectedLocation(loc.id);
        const sep = value.indexOf(' - ');
        if (sep !== -1) setSubValue(value.slice(sep + 3));
      } else {
        // Legacy free-text value
        setSelectedLocation('__other__');
        setSubValue(value);
      }
    }
  }, [value, locations.length]);

  const currentLoc = locations.find(l => l.id === selectedLocation);

  const buildFullLocation = (locId, sub) => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return sub || '';
    if (loc.type === 'other') return loc.name;
    if (!sub) return loc.name;
    if (loc.type === 'dormitory') return `${loc.name} - חדר ${sub}`;
    if (loc.type === 'classBuilding') return `${loc.name} - ${sub}`;
    return loc.name;
  };

  const handleLocationChange = (locId) => {
    setSelectedLocation(locId);
    setSubValue('');
    setSubError('');
    const loc = locations.find(l => l.id === locId);
    if (loc?.type === 'other') {
      onChange(loc.name);
    } else {
      onChange(''); // incomplete until sub is filled
    }
  };

  const handleSubChange = (val) => {
    setSubValue(val);
    setSubError('');

    if (!currentLoc) return;

    if (currentLoc.type === 'dormitory') {
      const num = parseInt(val);
      const { min, max } = getDormRange(currentLoc.name);
      if (val && (isNaN(num) || num < min || num > max)) {
        setSubError(`מספר חדר חייב להיות בין ${min} ל-${max}`);
        onChange('');
        return;
      }
    }

    if (currentLoc.type === 'classBuilding') {
      // Validate format: one or two hebrew letters + one or two digits, e.g. ז5 יב3
      const classRegex = /^[\u05d0-\u05ea]{1,2}\d{1,2}$/;
      if (val && !classRegex.test(val)) {
        setSubError('פורמט: אותיות עבריות + ספרות, למשל ז5 או יב3');
        onChange('');
        return;
      }
    }

    onChange(buildFullLocation(selectedLocation, val));
  };

  const dormRange = currentLoc?.type === 'dormitory' ? getDormRange(currentLoc.name) : null;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>מיקום *</Label>
        <Select value={selectedLocation} onValueChange={handleLocationChange}>
          <SelectTrigger>
            <SelectValue placeholder="בחר מיקום..." />
          </SelectTrigger>
          <SelectContent>
            {locations.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentLoc?.type === 'classBuilding' && (
        <div className="space-y-1.5">
          <Label>כיתה</Label>
          <Input
            placeholder="למשל: ז5, יב3"
            value={subValue}
            onChange={e => handleSubChange(e.target.value)}
            className={subError ? 'border-destructive' : ''}
          />
          {subError && <p className="text-xs text-destructive">{subError}</p>}
        </div>
      )}

      {currentLoc?.type === 'dormitory' && (
        <div className="space-y-1.5">
          <Label>מספר חדר</Label>
          <Input
            type="number"
            placeholder={dormRange ? `${dormRange.min}–${dormRange.max}` : 'מספר חדר'}
            value={subValue}
            onChange={e => handleSubChange(e.target.value)}
            min={dormRange?.min}
            max={dormRange?.max}
            className={subError ? 'border-destructive' : ''}
          />
          {subError && <p className="text-xs text-destructive">{subError}</p>}
          {dormRange && !subError && (
            <p className="text-xs text-muted-foreground">טווח: {dormRange.min}–{dormRange.max}</p>
          )}
        </div>
      )}
    </div>
  );
}