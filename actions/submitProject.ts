'use server'

import { createClient } from '@supabase/supabase-js'

// تهيئة الاتصال بقاعدة بيانات Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function submitProject(formData: FormData) {
  // استخراج البيانات من النموذج
  const data = {
    client_name: formData.get('client_name') as string,
    phone: formData.get('phone') as string,
    project_idea: formData.get('project_idea') as string,
  }

  try {
    // 1. تنفيذ الحفظ في Supabase بشكل صحيح ومنتظر
    const { error: dbError } = await supabase.from('project_requests').insert([data])
    if (dbError) {
      console.error('Supabase Error:', dbError)
    }

    // 2. إرسال الإشعار لتيليجرام بشكل مباشر
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (botToken && chatId) {
      const telegramMessage = `
🔔 **طلب مشروع جديد من الموقع:**
👤 **الاسم:** ${data.client_name}
📞 **الهاتف:** ${data.phone}
💬 **فكرة المشروع:** ${data.project_idea}
      `.trim()

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'Markdown'
        }),
      })
    }

    // رسالة نجاح تظهر للمستخدم على الموقع
    return "تم إرسال طلبك بنجاح، وسنتواصل معك قريباً!"

  } catch (error) {
    console.error('Submission Error:', error)
    return null
  }
}