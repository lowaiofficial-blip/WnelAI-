import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WnelLogo } from '../common/WnelLogo';

interface ThinkingAnimationProps {
  query?: string;
}

function generateThinkingSteps(query: string = ''): string[] {
  const rawClean = query.trim().replace(/\s+/g, ' ');
  const clean = rawClean.toLowerCase();
  
  if (!clean) {
    return [
      "Düşünüyorum...",
      "Analiz ediyorum...",
      "Çözümü planlıyorum...",
      "Kaynakları inceliyorum...",
      "Cevabı hazırlıyorum..."
    ];
  }

  // 1. Kodlama / Web / Yazılım
  const isCoding = /kod|html|css|js|javascript|typescript|react|vue|node|python|backend|frontend|api|fonksiyon|function|component|script|sayfa|tasarım|web|site|oyun|app|uygulama|hata|bug|fix|database|sql/.test(clean);
  if (isCoding) {
    let topic = "Kod mimarisini";
    if (/html|css|site|web|tasarım/.test(clean)) topic = "Arayüz ve stil yapısını";
    else if (/oyun|game/.test(clean)) topic = "Oyun mekaniklerini ve mantığını";
    else if (/hata|bug|fix/.test(clean)) topic = "Hata kaynağını ve çözümü";
    else if (/python|react|javascript|js|node/.test(clean)) topic = "Kod akışını ve fonksiyonları";

    return [
      `${topic} inceliyorum...`,
      "Mimariyi ve mantıksal akışı kurguluyorum...",
      "Bileşenleri ve kod bloklarını oluşturuyorum...",
      "Kodu optimize edip son haline getiriyorum...",
      "Yanıtı tamamlıyorum..."
    ];
  }

  // 2. Matematik / Mantık / Hesaplama
  const isMath = /hesapla|kaç|matematik|denklem|formül|oran|integral|türev|toplam|çöz|problem|grafik/.test(clean);
  if (isMath) {
    return [
      "Matematiksel problemi analiz ediyorum...",
      "Formül ve çözüm yöntemini belirliyorum...",
      "Adım adım hesaplamaları yapıyorum...",
      "Sonuçları doğrulayıp cevabı hazırlıyorum...",
      "Yanıtı tamamlıyorum..."
    ];
  }

  // 3. Çeviri / Metin / Yaratıcı Yazarlık
  const isWriting = /çevir|translate|metin|makale|yazı|şiir|hikaye|mektup|dilekçe|mail|özet|özetle|düzenle|paragraf/.test(clean);
  if (isWriting) {
    return [
      "Metnin konusunu ve anlatım tonunu değerlendiriyorum...",
      "İçerik planını ve cümle yapısını oluşturuyorum...",
      "Anlatımı zenginleştirip akıcı hale getiriyorum...",
      "Metni özenle tamamlıyorum...",
      "Cevabı sunuyorum..."
    ];
  }

  // 4. Genel soru analizi ve temiz başlık çıkarma
  let sanitizedQuery = rawClean
    .replace(/[?.,!;:_~*#+()\[\]{}"]+/g, '')
    .trim();

  // Soru kalıplarını ve dolgu kelimeleri temizleyelim
  const fillPatterns = [
    /\b(bana|bunu|şunu|hakkında|hakkinda|ile ilgili|ile alakali|bilgi ver|anlat|açıkla|acikla|nedir|ne demek|nasıl|nasil|neden|niçin|kimdir|nerede|yazar mısın|yazar misin|eder misin|misin|mısın)\b/gi
  ];

  let topic = sanitizedQuery;
  fillPatterns.forEach(pattern => {
    topic = topic.replace(pattern, '').trim();
  });
  topic = topic.replace(/\s+/g, ' ').trim();

  // Eğer temizlemeden sonra boş kaldıysa orijinalden ilk birkaç kelimeyi al
  if (!topic || topic.length < 2) {
    topic = sanitizedQuery.split(' ').slice(0, 4).join(' ');
  } else {
    // Çok uzunsa ilk 5 kelimesini al
    const words = topic.split(' ');
    if (words.length > 5) {
      topic = words.slice(0, 5).join(' ');
    }
  }

  if (topic.length > 1) {
    const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
    return [
      `"${formattedTopic}" konusunu inceliyorum...`,
      "İlgili detayları ve kavramları analiz ediyorum...",
      "Kapsamlı ve net açıklamayı yapılandırıyorum...",
      "Mantıksal bağlantıları tamamlıyorum...",
      "Cevabı hazırlıyorum..."
    ];
  }

  return [
    "Sorunuzu derinlemesine inceliyorum...",
    "Kavramları ve detayları analiz ediyorum...",
    "En net ve faydalı cevabı planlıyorum...",
    "Bilgileri derleyip toparlıyorum...",
    "Yanıtı hazırlıyorum..."
  ];
}

export function ThinkingAnimation({ query = '' }: ThinkingAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const steps = useMemo(() => generateThinkingSteps(query), [query]);

  useEffect(() => {
    setCurrentIndex(0);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1500);

    return () => clearInterval(interval);
  }, [steps]);

  const currentStep = steps[currentIndex] || steps[0];

  return (
    <div className="flex w-full justify-center my-6">
      <div className="flex flex-col items-center gap-3.5 bg-white/[0.02] border border-white/5 rounded-3xl py-4 px-6 md:px-10 backdrop-blur-md shadow-lg shadow-black/20 max-w-xl w-fit">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <WnelLogo size="md" withGlow={true} />
        </motion.div>
        
        <div className="relative min-h-[32px] w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${query}-${currentIndex}`}
              initial={{ opacity: 0, y: 7, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -7, filter: "blur(3px)" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex items-center justify-center w-full text-center"
            >
              <span className="animate-shimmer text-sm sm:text-base font-medium tracking-wide leading-relaxed px-3 break-words text-center">
                {currentStep}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
