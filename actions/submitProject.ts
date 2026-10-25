'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// تهيئة الاتصال بقاعدة بيانات Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// تهيئة الذكاء الاصطناعي
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function submitProject(formData: FormData) {
  // استخراج البيانات من النموذج
  const data = {
    client_name: formData.get('client_name') as string,
    phone: formData.get('phone') as string,
    project_idea: formData.get('project_idea') as string,
  }

  try {
    // توليد التقرير الفني عبر الذكاء الاصطناعي
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const prompt = `
    أنت مستشار تقني محترف في وكالة برمجيات. قم بتحليل فكرة المشروع التالية واكتب تقرير فني مفصل باللغة العربية.
    يجب أن يحتوي التقرير على:
    ### 1. ملخص الفكرة
    ### 2. المكدس التقني المقترح (Tech Stack) لتطبيقات الجوال، الويب، وقواعد البيانات.
    ### 3. الجدول الزمني وتقدير التكلفة (استخدم صيغة جداول لتقدير تكلفة التصميم، التطوير، والاختبار).
    ### 4. نصائح تقنية هامة.
    
    الرجاء استخدام التنسيق العريض (**نص**) والقوائم النقطية ليكون التقرير مرتباً.
    فكرة المشروع: ${data.project_idea}
    `
    const aiResult = await model.generateContent(prompt)
    const aiReport = aiResult.response.text()

    // تنفيذ الحفظ في Supabase
    const { error: dbError } = await supabase.from('project_requests').insert([data])
    if (dbError) {
      console.error('Supabase Error:', dbError)
    }

    // إرسال الإشعار والتقرير لتيليجرام بشكل محمي لتجنب انهيار الكود بسبب التنسيق
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (botToken && chatId) {
      const telegramMessage = `
🔔 **طلب مشروع جديد من الموقع:**
👤 **الاسم:** ${data.client_name}
📞 **الهاتف:** ${data.phone}
-----------------------------------
${aiReport}
      `.trim()

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            // تم إزالة parse_mode مؤقتاً لأن تيليجرام يرفض جداول Markdown الصادرة من الذكاء الاصطناعي
          }),
        })
      } catch (telegramError) {
        console.error('Telegram Error:', telegramError)
      }
    }

    // إرجاع تقرير الذكاء الاصطناعي ليظهر للمستخدم على الموقع
    return aiReport

  } catch (error) {
    console.error('Submission Error:', error)
    return null
  }
}