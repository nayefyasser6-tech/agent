'use client'

import { useState, useRef } from 'react';
import { submitProject } from '@/actions/submitProject';

const content = {
  ar: {
    title: "AI Agency Quote",
    desc: "أدخل تفاصيل مشروعك للحصول على تحليل فوري.",
    name: "الاسم الكريم",
    namePlace: "أدخل اسمك هنا",
    phone: "رقم الهاتف",
    idea: "فكرة المشروع",
    ideaPlace: "اكتب رسالتك هنا...",
    btn: "إرسال الطلب",
    loading: "جاري تحليل الفكرة...",
    toggleLang: "English"
  },
  en: {
    title: "AI Agency Quote",
    desc: "Enter your project details for an instant analysis.",
    name: "Full Name",
    namePlace: "Enter your name here",
    phone: "Phone Number",
    idea: "Project Idea",
    ideaPlace: "Write your message here...",
    btn: "Submit Request",
    loading: "Analyzing idea...",
    toggleLang: "العربية"
  }
};

export default function Page() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const t = content[lang];

  const handleAction = async (formData: FormData) => {
    setIsLoading(true);
    setAiResponse(''); // مسح التحليل السابق إن وجد
    
    try {
      const responseText = await submitProject(formData);
      if (responseText) {
        setAiResponse(responseText); // استقبال وعرض رد الذكاء الاصطناعي
      }
      formRef.current?.reset(); // تفريغ حقول الإدخال تلقائياً
    } catch (error) {
      console.error("Error submitting project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden bg-neutral-950 selection:bg-orange-500 selection:text-white transition-all duration-500"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-orange-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="fixed top-6 left-6 z-50">
        <button 
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg"
          dir={lang === 'ar' ? 'ltr' : 'rtl'}
        >
          {t.toggleLang}
        </button>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-[#111113]/80 backdrop-blur-2xl border border-white/5 p-8 rounded-[2rem] shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tight">
              {t.title}
            </h1>
            <p className="text-neutral-400 text-sm font-medium">{t.desc}</p>
          </div>

          <form ref={formRef} action={handleAction} className="space-y-6">
            <div>
              <label htmlFor="client_name" className="block text-sm font-bold mb-2 text-neutral-300">{t.name}</label>
              <input 
                type="text" 
                id="client_name" 
                name="client_name" 
                required 
                disabled={isLoading}
                className="w-full bg-[#0a0a0a]/80 border border-transparent rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500/30 focus:ring-1 focus:ring-orange-500/30 transition-all font-medium placeholder-neutral-700 text-white disabled:opacity-50" 
                placeholder={t.namePlace} 
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold mb-2 text-neutral-300">{t.phone}</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                required 
                dir="ltr"
                disabled={isLoading}
                className={`w-full bg-[#0a0a0a]/80 border border-transparent rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500/30 focus:ring-1 focus:ring-orange-500/30 transition-all font-medium placeholder-neutral-700 text-white disabled:opacity-50 ${lang === 'ar' ? 'text-right' : 'text-left'}`} 
                placeholder="05XXXXXXXX" 
              />
            </div>

            <div>
              <label htmlFor="project_idea" className="block text-sm font-bold mb-2 text-neutral-300">{t.idea}</label>
              <textarea 
                id="project_idea" 
                name="project_idea" 
                required 
                rows={4} 
                disabled={isLoading}
                className="w-full bg-[#0a0a0a]/80 border border-transparent rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500/30 focus:ring-1 focus:ring-orange-500/30 transition-all font-medium placeholder-neutral-700 text-white resize-none disabled:opacity-50" 
                placeholder={t.ideaPlace} 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-lg py-4 px-6 rounded-xl hover:from-red-500 hover:to-orange-400 active:scale-95 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.25)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.4)] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? t.loading : t.btn}
            </button>
          </form>
        </div>

        {/* صندوق عرض تحليل الذكاء الاصطناعي للمستخدم */}
        {aiResponse && (
          <div className="mt-6 bg-[#111113]/80 backdrop-blur-2xl border border-orange-500/30 p-6 rounded-[2rem] shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-orange-500 font-bold mb-3 flex items-center gap-2">
              <span>🤖</span> {lang === 'ar' ? 'تحليل المستشار التقني:' : 'AI Advisor Analysis:'}
            </h3>
            <div className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
              {aiResponse}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}