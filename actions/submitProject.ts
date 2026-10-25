'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function submitProject(formData: FormData) {
  const data = {
    client_name: formData.get('client_name') as string,
    phone: formData.get('phone') as string,
    project_idea: formData.get('project_idea') as string,
  }

  try {
    // 1. الحفظ في Supabase
    const { error: dbError } = await supabase.from('project_requests').insert([data])
    if (dbError) console.error('Supabase Error:', dbError)

    // 2. توليد التقرير (معزول لمنع انهيار الكود إذا فشل)
    let aiReport = "تعذر توليد التقرير التلقائي."
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const prompt = `اكتب تقرير فني مختصر للفكرة التالية: ${data.project_idea}`
      const aiResult = await model.generateContent(prompt)
      aiReport = aiResult.response.text()
    } catch (geminiError) {
      console.error("Gemini Error:", geminiError)
    }

    // 3. إرسال تيليجرام
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (botToken && chatId) {
      const telegramMessage = `
🔔 طلب مشروع جديد:
👤 الاسم: ${data.client_name}
📞 الهاتف: ${data.phone}
-----------------------------------
${aiReport}
      `.trim()

      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage.substring(0, 4000),
        }),
      })

      // طباعة خطأ تيليجرام إن وجد
      if (!telegramResponse.ok) {
        const err = await telegramResponse.json()
        console.error("Telegram API Error:", err)
      }
    } else {
      console.error("Missing Telegram Environment Variables")
    }

    return aiReport

  } catch (error) {
    console.error('Submission Error:', error)
    return "تم استلام طلبك بنجاح وسنتواصل معك قريباً."
  }
}