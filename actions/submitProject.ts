'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function submitProject(formData: FormData) {
  const data = {
    client_name: formData.get('client_name') as string,
    phone: formData.get('phone') as string,
    project_idea: formData.get('project_idea') as string,
  }

  try {
    const [supabaseResult, n8nResponse] = await Promise.all([
      supabase.from('project_requests').insert([data]),
      fetch(process.env.N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    ])

    const result = await n8nResponse.json()
    return result.reply

  } catch (error) {
    console.error('Submission Error:', error)
    return null
  }
}