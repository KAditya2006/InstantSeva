const SERVICE_KEYWORDS = {
  plumber: ['plumber', 'plumbers', 'प्लंबर', 'প্লাম্বার', 'ప్లంబర్', 'પ્લમ્બર', 'ପ୍ଲମ୍ବର', 'பிளம்பர்', 'پلمبر'],
  electrician: ['electrician', 'electricians', 'इलेक्ट्रिशियन', 'ইলেকট্রিশিয়ান', 'ఎలక్ట్రిషియన్', 'ઇલેક્ટ્રિશિયન', 'ଇଲେକ୍ଟ୍ରିସିଆନ', 'الیکٹریشن'],
  'home tutors': ['home tutor', 'home tutors', 'ट्यूटर', 'होम ट्यूटर', 'হোম টিউটর', 'హోం ట్యూటర్', 'હોમ ટ્યુટર'],
  carpenters: ['carpenter', 'carpenters', 'कारपेंटर', 'बढ़ई', 'কাঠমিস্ত্রি', 'కార్పెంటర్', 'સુથાર'],
  painters: ['painter', 'painters', 'पेंटर', 'रंगाई', 'পেইন্টার', 'పెయింటర్', 'પેઇન્ટર'],
  'house cleaner': ['cleaner', 'house cleaner', 'cleaning', 'सफाई', 'घर की सफाई', 'ক্লিনিং', 'ঘর পরিষ্কার', 'హౌస్ క్లీనింగ్', 'ઘર સફાઈ', 'ଘର ସଫା'],
  'ac repair/service': ['ac', 'ac repair', 'air conditioner', 'एसी', 'एसी रिपेयर', 'AC Repair', 'এসি', 'ఏసీ', 'એસી', 'AC ମରାମତି'],
  'appliances repair/service': ['appliance', 'appliances', 'washing machine', 'fridge', 'मशीन रिपेयर', 'appliance repair', 'অ্যাপ্লায়েন্স', 'అప్లయన్స్'],
  'laptop/mobile repair': ['laptop', 'mobile', 'phone repair', 'मोबाइल', 'लैपटॉप', 'মোবাইল', 'ల్యాప్‌టాప్', 'મોબાઇલ'],
  'internet technician': ['internet', 'wifi', 'broadband', 'वाईफाई', 'इंटरनेट', 'ইন্টারনেট', 'వైఫై', 'વાઇફાઇ'],
  driver: ['driver', 'ड्राइवर', 'ড্রাইভার', 'డ్రైవర్', 'ડ્રાઇવર'],
  cook: ['cook', 'chef', 'कुक', 'रसोइया', 'রাঁধুনি', 'కుక్', 'રસોઈયા'],
  babysitter: ['babysitter', 'baby sitter', 'nanny', 'बेबीसिटर', 'आया'],
  caretaker: ['caretaker', 'care taker', 'देखभाल', 'केयरटेकर'],
  pharmacist: ['pharmacist', 'medicine', 'दवा', 'फार्मासिस्ट'],
  'door/lock repair': ['lock', 'door lock', 'key', 'ताला', 'चाबी', 'লক'],
  'tv repair': ['tv', 'television', 'टीवी', 'টিভি'],
  'glass repair': ['glass', 'शीशा', 'कांच', 'গ্লাস'],
  'pest control': ['pest', 'pest control', 'कीट', 'পেস্ট', 'ପୋକ'],
  gardening: ['garden', 'gardening', 'माली', 'बागवानी', 'বাগান'],
  'home decor': ['decor', 'home decor', 'सजावट', 'ডেকর']
};

const normalize = (value) => String(value || '').trim().toLowerCase();

export const normalizeServiceSearch = (query) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return '';

  const match = Object.entries(SERVICE_KEYWORDS).find(([, keywords]) => (
    keywords.some((keyword) => {
      const normalizedKeyword = normalize(keyword);
      return normalizedQuery === normalizedKeyword ||
        normalizedQuery.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedQuery);
    })
  ));

  return match?.[0] || query;
};

export const getServiceKeywords = () => SERVICE_KEYWORDS;
