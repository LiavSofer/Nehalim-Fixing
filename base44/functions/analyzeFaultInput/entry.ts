import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { rawText, locationText, descriptionText } = await req.json();

  // Support both unified rawText and legacy separate fields
  const inputText = rawText || `מיקום: ${locationText || ''}\nתיאור: ${descriptionText || ''}`;

  // Fetch locations and categories in parallel
  const [locations, categories] = await Promise.all([
    base44.asServiceRole.entities.Location.list(),
    base44.asServiceRole.entities.FaultCategory.list(),
  ]);

  const locationNames = locations.map(l => l.name);
  const categoryNames = categories.map(c => c.name);

  const defaultCategories = ['חשמל', 'אינסטלציה', 'צבע ושפכטל', 'ניקיון', 'אחר'];
  const finalCategories = categoryNames.length > 0 ? categoryNames : defaultCategories;

  const prompt = `
אתה עוזר לניהול תקלות במוסד חינוכי. קיבלת קלט חופשי ממשתמש (עשוי להגיע מדיבור קולי) ועליך להחזיר JSON מובנה.

**קלט מהמשתמש:**
"${inputText}"

**רשימת מיקומים מאושרים (בחר רק מרשימה זו!):**
${locationNames.length > 0 ? locationNames.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'אין מיקומים מוגדרים עדיין'}

**רשימת קטגוריות תקלות:**
${finalCategories.map((n, i) => `${i + 1}. ${n}`).join('\n')}

**הוראות:**
1. זהה את שם המיקום (בניין / פנימייה / אגף וכדומה) מהקלט והתאם אותו לאחד מהמיקומים המאושרים. השוואה גמישה: "פנימייה ח" ≈ "פנימייה ח׳", "פנימייה 8" ≈ "פנימייה ח׳" וכן הלאה. אם אין התאמה — החזר את הקלט כפי שהוא.
2. חלץ את מספר החדר / כיתה בנפרד. מספר חדר הוא המספר שמופיע אחרי המילה "חדר" או "כיתה", או מספר בן 2-4 ספרות שאינו חלק משם המיקום. לדוגמה: "פנימייה ח חדר 802" → roomNumber: "802". אם אין — החזר מחרוזת ריקה.
3. חלץ את תיאור התקלה בלבד (ללא המיקום וללא מספר החדר).
4. בחר קטגוריית תקלה מהרשימה לפי תיאור התקלה.
5. צור כותרת קצרה של 2-3 מילים בעברית שמתארת את התקלה (למשל: "נזילת מים", "חלון שבור", "דלת תקועה").

**דוגמאות:**
- "פנימייה ח חדר 802, הדלת לא נסגרת" → normalizedLocation: "פנימייה ח׳", roomNumber: "802", description: "הדלת לא נסגרת"
- "בניין כיתות ב כיתה 305 ברז מטפטף" → normalizedLocation: "בניין כיתות ב", roomNumber: "305", description: "ברז מטפטף"

**החזר JSON בפורמט הבא בלבד:**
{
  "normalizedLocation": "שם המיקום מהרשימה",
  "roomNumber": "מספר חדר / כיתה אם קיים",
  "description": "תיאור התקלה בלבד",
  "faultCategory": "שם הקטגוריה מהרשימה",
  "faultTitle": "כותרת קצרה 2-3 מילים"
}
`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        normalizedLocation: { type: 'string' },
        roomNumber: { type: 'string' },
        description: { type: 'string' },
        faultCategory: { type: 'string' },
        faultTitle: { type: 'string' },
      },
    },
  });

  return Response.json(result);
});