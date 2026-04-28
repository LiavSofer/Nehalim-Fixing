import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { locationText, descriptionText } = await req.json();

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
אתה עוזר לניהול תקלות במוסד. קיבלת קלט חופשי ממשתמש ועליך להחזיר JSON מובנה.

**קלט מהמשתמש:**
- מיקום (חופשי): "${locationText || ''}"
- תיאור תקלה: "${descriptionText || ''}"

**רשימת מיקומים מאושרים:**
${locationNames.length > 0 ? locationNames.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'אין מיקומים מוגדרים עדיין'}

**רשימת קטגוריות תקלות:**
${finalCategories.map((n, i) => `${i + 1}. ${n}`).join('\n')}

**הוראות:**
1. בחר את המיקום המתאים ביותר מהרשימה המאושרת לפי הקלט החופשי. אם אין התאמה ברורה, החזר את הקלט המקורי.
2. חלץ מספר חדר / כיתה מהקלט אם קיים (למשל: "101", "ז5", "קומה 2 חדר 14"). אם אין — החזר מחרוזת ריקה.
3. בחר קטגוריית תקלה מהרשימה לפי תיאור התקלה. בחר תמיד אחת מהרשימה.
4. צור כותרת קצרה של 2-3 מילים בעברית שמתארת את התקלה הספציפית (למשל: "נזילת מים", "חלון שבור", "תאורה לא עובדת", "דלת תקועה").

**החזר JSON בפורמט הבא בלבד (ללא טקסט נוסף):**
{
  "normalizedLocation": "שם המיקום מהרשימה",
  "roomNumber": "מספר חדר / כיתה אם קיים",
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
      faultCategory: { type: 'string' },
      faultTitle: { type: 'string' },
      },
    },
  });

  return Response.json(result);
});