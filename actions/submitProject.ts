'use server'

// زيادة وقت الانتظار المسموح به في Vercel لتجنب قطع الاتصال قبل رد Gemini
export const maxDuration = 60; 

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
    const { error: dbError } = await supabase.from('project_requests').insert([data])
    if (dbError) console.error('Supabase Error:', dbError)

    let aiReport = "تعذر توليد التقرير التلقائي."
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const prompt = `اكتب تقرير فني مختصر للفكرة التالية: ${data.project_idea}`
      const aiResult = await model.generateContent(prompt)
      aiReport = aiResult.response.text()
    } catch (geminiError: any) {
      // طباعة الخطأ بشكل مفصل أكثر لمعرفة ما إذا كان بسبب المفتاح أو الشبكة
      console.error("Gemini Detailed Error:", geminiError?.message || geminiError)
    }

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

      if (!telegramResponse.ok) {
        const err = await telegramResponse.json()
        console.error("Telegram API Error:", err)
      }
    }

    return aiReport

  } catch (error) {
    console.error('Submission Error:', error)
    return "تم استلام طلبك بنجاح وسنتواصل معك قريباً."
  }
}