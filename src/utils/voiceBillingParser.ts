import { Product } from '../types';

export interface RecognizedVoiceItem {
  product: Product;
  quantity: number;
  matchedName: string;
  matchedTamilName?: string;
  confidence: number;
}

export interface VoiceParseResult {
  intent: 'ADD_ITEM' | 'CHECKOUT' | 'CLEAR_CART' | 'UNKNOWN';
  items: RecognizedVoiceItem[];
  spokenFeedback: string;
  transcript: string;
}

// Tamil number mappings to numerals
const TAMIL_NUMBER_MAP: Record<string, number> = {
  'ஒரு': 1,
  'ஒன்று': 1,
  'ரெண்டு': 2,
  'இரண்டு': 2,
  'மூணு': 3,
  'மூன்று': 3,
  'நாலு': 4,
  'நான்கு': 4,
  'அஞ்சு': 5,
  'ஐந்து': 5,
  'ஆறு': 6,
  'ஏழு': 7,
  'எட்டு': 8,
  'ஒன்பது': 9,
  'பத்து': 10,
  'பன்னிரண்டு': 12,
  'பதினைந்து': 15,
  'இருபது': 20,
  'அரை': 1,
  'கால்': 1,
};

const ENGLISH_NUMBER_MAP: Record<string, number> = {
  'one': 1,
  'a': 1,
  'an': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'half': 1,
  'quarter': 1,
};

// Common Tamil Nadu grocery phonetics & aliases mapped to search keywords
const GROCERY_SYNONYMS: { keywords: string[]; targetKeywords: string[] }[] = [
  {
    keywords: ['பால்', 'paal', 'pal', 'milk', 'aavin', 'ஆவின்', 'pasumpaal', 'பசும்பால்'],
    targetKeywords: ['milk', 'aavin', 'பால்', 'பசும்பால்'],
  },
  {
    keywords: ['தக்காளி', 'thakkali', 'tomato', 'tomatoes', 'naatu', 'நாட்டு'],
    targetKeywords: ['tomato', 'thakkali', 'தக்காளி'],
  },
  {
    keywords: ['வெங்காயம்', 'vengayam', 'onion', 'onions', 'sambar vengayam', 'சின்ன வெங்காயம்', 'shallot'],
    targetKeywords: ['onion', 'vengayam', 'வெங்காயம்'],
  },
  {
    keywords: ['அரிசி', 'arisi', 'rice', 'ponni', 'பொன்னி', 'புழுங்கல்', 'boiled rice', 'idli rice'],
    targetKeywords: ['rice', 'arisi', 'ponni', 'அரிசி'],
  },
  {
    keywords: ['தேங்காய்', 'thengai', 'coconut', 'pollachi'],
    targetKeywords: ['coconut', 'thengai', 'தேங்காய்'],
  },
  {
    keywords: ['முருங்கை', 'முருங்கைக்காய்', 'murungai', 'murungakkai', 'drumstick'],
    targetKeywords: ['drumstick', 'murungakkai', 'முருங்கைக்காய்'],
  },
  {
    keywords: ['வாழைப்பழம்', 'vazhai', 'vazhaipazham', 'banana', 'bananas', 'poovan', 'பூவன்'],
    targetKeywords: ['banana', 'poovan', 'வாழைப்பழம்', 'vazhaipazham'],
  },
  {
    keywords: ['எண்ணெய்', 'நல்லெண்ணெய்', 'oil', 'sesame oil', 'idhayam', 'இதயம்'],
    targetKeywords: ['oil', 'sesame', 'நல்லெண்ணெய்', 'idhayam'],
  },
  {
    keywords: ['பருப்பு', 'துவரம்', 'துவரம் பருப்பு', 'paruppu', 'dhal', 'dal', 'toor'],
    targetKeywords: ['toor', 'dal', 'paruppu', 'பருப்பு'],
  },
  {
    keywords: ['காபி', 'காபி தூள்', 'coffee', 'degree coffee', 'kumbakonam'],
    targetKeywords: ['coffee', 'degree', 'காபி'],
  },
  {
    keywords: ['அல்வா', 'ஹல்வா', 'halwa', 'tirunelveli', 'திருநெல்வேலி'],
    targetKeywords: ['halwa', 'tirunelveli', 'அல்வா'],
  },
  {
    keywords: ['நெய்', 'ghee', 'udhayam', 'grb'],
    targetKeywords: ['ghee', 'நெய்'],
  },
  {
    keywords: ['தயிர்', 'curd', 'hatsun', 'பாக்கெட் தயிர்'],
    targetKeywords: ['curd', 'தயிர்'],
  },
  {
    keywords: ['சாம்பார் பொடி', 'சாம்பார் தூள்', 'sambar powder', 'sakthi'],
    targetKeywords: ['sambar powder', 'சாம்பார்'],
  },
  {
    keywords: ['அப்பளம்', 'appalam', 'papad', 'ambika'],
    targetKeywords: ['appalam', 'அப்பளம்'],
  },
  {
    keywords: ['கடுகு', 'mustard', 'kadugu'],
    targetKeywords: ['mustard', 'கடுகு'],
  },
  {
    keywords: ['சர்க்கரை', 'சீனி', 'sugar', 'sakkarai'],
    targetKeywords: ['sugar', 'சர்க்கரை'],
  },
  {
    keywords: ['உப்பு', 'salt', 'uppu', 'tata'],
    targetKeywords: ['salt', 'உப்பு'],
  },
];

/**
 * Extracts numeric quantity from a text fragment in Tamil or English
 */
export const extractQuantity = (text: string): number => {
  const clean = text.toLowerCase().trim();

  // 1. Direct digits (e.g., "2", "3 kg", "5 packets")
  const digitMatch = clean.match(/(\d+(\.\d+)?)/);
  if (digitMatch) {
    const parsed = parseFloat(digitMatch[1]);
    if (!isNaN(parsed) && parsed > 0) return Math.min(parsed, 100);
  }

  // 2. Tamil word numbers
  for (const [word, val] of Object.entries(TAMIL_NUMBER_MAP)) {
    if (clean.includes(word)) return val;
  }

  // 3. English word numbers
  const words = clean.split(/\s+/);
  for (const w of words) {
    if (ENGLISH_NUMBER_MAP[w]) return ENGLISH_NUMBER_MAP[w];
  }

  return 1; // Default single unit
};

/**
 * Matches a spoken segment to the best catalog product
 */
export const matchProductFromText = (
  segment: string,
  catalog: Product[]
): { product: Product; confidence: number } | null => {
  const raw = segment.toLowerCase().trim();
  if (!raw) return null;

  // Clean common noise words
  const clean = raw
    .replace(/(add|போடு|சேர்|கிலோ|பாக்கெட்|packet|packets|pack|kg|kilo|litre|litres|ltr|nos|pieces|pcs|please|கொண்டுவா)/gi, '')
    .trim();

  let bestMatch: Product | null = null;
  let highestScore = 0;

  for (const p of catalog) {
    const pName = (p.name || '').toLowerCase();
    const pTamil = (p.nameTamil || '').toLowerCase();
    const pCategory = (p.category || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();

    let score = 0;

    // 1. Direct Tamil exact substring match
    if (pTamil && clean.includes(pTamil)) {
      score += 90;
    } else if (pTamil && pTamil.includes(clean) && clean.length > 2) {
      score += 75;
    }

    // 2. Direct English exact substring match
    if (clean.length > 2 && pName.includes(clean)) {
      score += 70;
    }

    // 3. Synonym / Tamil Nadu colloquial mapping
    for (const group of GROCERY_SYNONYMS) {
      const segmentHasKeyword = group.keywords.some(k => clean.includes(k) || raw.includes(k));
      if (segmentHasKeyword) {
        const productHasTarget = group.targetKeywords.some(
          t => pName.includes(t) || pTamil.includes(t) || pCategory.includes(t) || pDesc.includes(t)
        );
        if (productHasTarget) {
          score += 65;
        }
      }
    }

    // 4. Word-by-word token overlap
    const tokens = clean.split(/\s+/).filter(t => t.length > 2);
    for (const t of tokens) {
      if (pName.includes(t)) score += 20;
      if (pTamil.includes(t)) score += 30;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = p;
    }
  }

  if (bestMatch && highestScore >= 30) {
    return { product: bestMatch, confidence: Math.min(1.0, highestScore / 100) };
  }

  return null;
};

/**
 * Main Bilingual Voice Billing Parser
 * Parses speech transcript into actionable items or intents
 */
export const parseVoiceBillingTranscript = (
  transcript: string,
  catalog: Product[],
  preferredLang: 'ta' | 'en' = 'ta'
): VoiceParseResult => {
  const cleanTranscript = transcript.trim();
  const lower = cleanTranscript.toLowerCase();

  // 1. Check for Checkout intent
  const checkoutKeywords = [
    'checkout',
    'pay',
    'payment',
    'finish bill',
    'complete bill',
    'done',
    'முடிந்தது',
    'பில் செய்',
    'பில் போடு',
    'கட்டணம்',
    'பணம்',
    'செக்அவுட்',
  ];
  if (checkoutKeywords.some(k => lower.includes(k))) {
    return {
      intent: 'CHECKOUT',
      items: [],
      spokenFeedback:
        preferredLang === 'ta'
          ? 'பில் நிறைவுற்றது. கட்டண முறைக்கு செல்கிறது.'
          : 'Proceeding to payment checkout.',
      transcript: cleanTranscript,
    };
  }

  // 2. Check for Clear Cart intent
  const clearKeywords = ['clear cart', 'reset cart', 'பில் அழி', 'அனைத்தும் நீக்கு'];
  if (clearKeywords.some(k => lower.includes(k))) {
    return {
      intent: 'CLEAR_CART',
      items: [],
      spokenFeedback:
        preferredLang === 'ta' ? 'கார்ட் அழிக்கப்பட்டது.' : 'Cart has been cleared.',
      transcript: cleanTranscript,
    };
  }

  // 3. Multi-item parsing (split on "மற்றும்", "and", ",", "+", "கூட")
  const segments = lower
    .split(/(?:மற்றும்|அப்புறம்|and|\+|&|,)/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const recognizedList: RecognizedVoiceItem[] = [];

  for (const seg of segments) {
    const qty = extractQuantity(seg);
    const match = matchProductFromText(seg, catalog);

    if (match) {
      // Prevent duplicates in same command by summing quantities
      const existing = recognizedList.find(r => r.product.id === match.product.id);
      if (existing) {
        existing.quantity += qty;
      } else {
        recognizedList.push({
          product: match.product,
          quantity: qty,
          matchedName: match.product.name,
          matchedTamilName: match.product.nameTamil,
          confidence: match.confidence,
        });
      }
    }
  }

  // Fallback: If split didn't find anything, try matching whole phrase
  if (recognizedList.length === 0) {
    const qty = extractQuantity(lower);
    const match = matchProductFromText(lower, catalog);
    if (match) {
      recognizedList.push({
        product: match.product,
        quantity: qty,
        matchedName: match.product.name,
        matchedTamilName: match.product.nameTamil,
        confidence: match.confidence,
      });
    }
  }

  // Construct spoken feedback
  if (recognizedList.length > 0) {
    let feedback = '';
    if (preferredLang === 'ta') {
      const itemSummaries = recognizedList.map(
        it => `${it.quantity} ${it.matchedTamilName || it.product.name.split('/')[0].trim()}`
      );
      feedback = `சேர்க்கப்பட்டது: ${itemSummaries.join(', ')}`;
    } else {
      const itemSummaries = recognizedList.map(
        it => `${it.quantity}x ${it.product.name.split('/')[0].trim()}`
      );
      feedback = `Added ${itemSummaries.join(', ')} to bill.`;
    }

    return {
      intent: 'ADD_ITEM',
      items: recognizedList,
      spokenFeedback: feedback,
      transcript: cleanTranscript,
    };
  }

  // Unknown speech
  return {
    intent: 'UNKNOWN',
    items: [],
    spokenFeedback:
      preferredLang === 'ta'
        ? `கேட்கப்பட்டது: "${cleanTranscript}". பொருள் பொருந்தவில்லை.`
        : `Heard: "${cleanTranscript}". No catalog match found.`,
    transcript: cleanTranscript,
  };
};

/**
 * Text-to-Speech audio reader using browser Web Speech Synthesis
 */
export const speakVoiceFeedback = (text: string, lang: 'ta' | 'en' = 'ta') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
  }
};
