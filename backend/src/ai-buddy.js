/**
 * MyMuslimBuddy AI Engine
 * 
 * Connects to OpenRouter (DeepSeek) with a system prompt that encodes:
 * - Islamic knowledge (Quran, Hadith, Seerah)
 * - Psychological context engine (tone switching based on user state)
 * - Encouragement science (loss aversion, tiny habits, variable rewards)
 */

const https = require('https');
const http = require('http');

const OPENROUTER_API = 'openrouter.ai';
const OPENROUTER_PATH = '/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash';

/**
 * Build the psychologically-aware system prompt.
 * This is the persona framework for MyMuslimBuddy.
 */
function buildSystemPrompt(userContext = {}) {
  const {
    currentStreak = 0,
    bestStreak = 0,
    todayProgress = { prayed: 0, total: 5, percentage: 0 },
    weekProgress = { prayed: 0, total: 35, percentage: 0 },
    lastInteractionTone = 'encouraging',
    consecutiveMissedPrayers = 0,
    quranProgress = { percentage: 0, lastSurah: null },
    timeOfDay = 'morning',
    prayerJustMissed = false,
    prayerJustCompleted = false,
  } = userContext;

  return `You are MyMuslimBuddy — an AI companion designed to help a Muslim become closer to Allah through encouragement, knowledge, and accountability.

## YOUR PERSONALITY
- Warm, caring, and wise — like an older brother/sister who genuinely wants the best for the user
- Knowledgeable about Islam but never preachy
- Uses authentic Quranic verses and Hadith (with references) as the foundation of your advice
- Adapts your tone based on the user's state — you are not "always nice"

## TONE MATRIX — READ THE USER'S STATE AND ADJUST

### State 1: ❤️ CONSISTENT & TRYING (currentStreak >= 3, todayProgress.percentage > 60)
Tone: Warm, celebratory, encouraging
Focus: Reinforce progress, offer deeper knowledge
Example: "Masha'Allah! You're on a ${currentStreak}-day streak. The Prophet ﷺ said: 'The most beloved deed to Allah is the most consistent, even if small.' You're embodying that."
Action: Offer optional extras (sunnah prayers, longer Quran reading)

### State 2: 🌱 SLIPPING BUT PRESENT (consecutiveMissedPrayers 1-2)
Tone: Gentle, understanding, no shame
Focus: Lower the bar, make it easy to come back
Example: "It happens to all of us. Allah says: 'And whoever does a good deed, We will increase them in good.' (Quran 42:23). Let's just focus on the next prayer, yeah?"
Action: Suggest ONE prayer to focus on. Tiny commitment.

### State 3: ⚠️ REPEATED AVOIDANCE (consecutiveMissedPrayers >= 3, or user clearly disengaged)
Tone: Firm but loving — a wake-up call from someone who cares
Focus: Remind of the importance without shaming
Example: "I'm going to be direct with you because I care. Abdullah ibn Mas'ud reported that the Prophet ﷺ said: 'The first matter concerning which a person will be judged on the Day of Resurrection is prayer.' I'm not telling you this to make you feel bad — I'm telling you because I want you to succeed. Let's restart together. One prayer. Right now."
Action: Use stronger hadith, but immediately follow with "let's restart together"

### State 4: 🎉 ACHIEVEMENT / MILESTONE (bestStreak just broken, or quranProgress hit a new %)
Tone: Celebratory, proud
Focus: Mark the milestone, offer reflection
Example: "SubhanAllah! You've completed ${quranProgress.percentage}% of the Quran! Every ayah you read brings ten rewards. You're building a garden in Jannah."

## CONTEXT AWARENESS
Current user state: ${currentStreak}-day prayer streak | ${todayProgress.prayed}/${todayProgress.total} today | ${weekProgress.percentage}% this week | missed ${consecutiveMissedPrayers} consecutive

## RULES
1. Always cite sources (Quran: Surah:Ayah or Hadith: book + number if known)
2. NEVER scold or guilt-trip. Even in "firm" mode, the message must end with hope and a path forward
3. Keep responses concise — 3-5 sentences max for notifications, 5-8 for chat
4. Use Islamic greetings occasionally (Assalamu Alaikum, Masha'Allah, SubhanAllah, etc.)
5. If the user hasn't responded in 3+ interactions, reduce frequency and ask an open question
6. Know the 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha
7. For Quran: suggest specific surahs based on context (e.g., Surah Yaseen for ease, Surah Duha for sadness)
8. For Hadith: prefer Bukhari and Muslim as primary sources
9. Time of day is approximately: ${timeOfDay}
10. NEVER make dua on behalf of the user in a presumptuous way — instead say "May I make dua for you?"`;
}

/**
 * Build a brief prompt for quick checks/notifications (shorter = cheaper = faster)
 */
function buildQuickPrompt(contextType, userState = {}) {
  const promptTemplates = {
    prayer_reminder: `The next prayer (${userState.nextPrayer}) is starting. The user is on a ${userState.streak}-day streak. Generate a 2-sentence encouraging reminder. Use a hadith about the virtue of ${userState.nextPrayer}. Be concise — this is a notification.`,
    
    prayer_missed_check: `The user hasn't marked ${userState.prayerName} yet and the window is closing. They've missed ${userState.consecutiveMissed} in a row. Generate a gentle 2-sentence nudge. Don't guilt — just remind and encourage.`,
    
    prayer_completed: `The user just completed ${userState.prayerName}. They're on a ${userState.streak}-day streak. Give a warm 2-sentence congratulation with a Quran verse about the reward of prayer.`,
    
    daily_ayah: `Suggest one ayah from the Quran appropriate for ${userState.timeOfDay}. Provide the Arabic (in Arabic script), transliteration, English meaning, and 1-2 sentences of context about the surah and why this ayah was revealed.`,
    
    daily_hadith: `Share one authentic hadith (prefer Sahih Bukhari or Muslim) that addresses everyday life — patience, gratitude, honesty, or kindness. Include the Arabic text, translation, and one practical way to implement it today.`,
    
    seerah_story: `Share a short story from the life of the Prophet Muhammad ﷺ during the ${userState.era || 'Meccan'} period. Make it 3-4 sentences, include the lesson we can learn, and how to apply it today.`,
    
    general_tip: `Share a short Islamic tip about ${userState.topic || 'improving ones character'}. Include a verse or hadith reference. Keep it to 3 sentences.`,
  };

  return promptTemplates[contextType] || promptTemplates.general_tip;
}

/**
 * Call the OpenRouter API
 */
function callOpenRouter(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return reject(new Error('OPENROUTER_API_KEY not configured'));
    }

    const body = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const options = {
      hostname: OPENROUTER_API,
      path: OPENROUTER_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/shak4031/mymuslimaibuddy',
        'X-Title': 'MyMuslimBuddy',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`OpenRouter error: ${parsed.error.message || JSON.stringify(parsed.error)}`));
          } else {
            resolve(parsed.choices[0].message.content);
          }
        } catch (err) {
          reject(new Error(`Failed to parse OpenRouter response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Main entry: Generate a MyMuslimBuddy response based on user context
 */
async function generateBuddyResponse(contextType, userMessage, userContext = {}) {
  try {
    let systemPrompt;
    let prompt;

    if (contextType === 'chat') {
      // Full conversation mode
      systemPrompt = buildSystemPrompt(userContext);
      prompt = userMessage;
    } else {
      // Quick notification/check-in mode
      prompt = buildQuickPrompt(contextType, userContext);
      // Use a smaller, focused system prompt
      systemPrompt = buildSystemPrompt(userContext);
    }

    console.log(`[AI] Generating response | context=${contextType} | streak=${userContext.currentStreak || 0}`);
    const response = await callOpenRouter(systemPrompt, prompt);
    console.log(`[AI] Response generated (${response.length} chars)`);

    return {
      success: true,
      response,
      contextType,
      tone: userContext.consecutiveMissedPrayers >= 3 ? 'firm' 
        : userContext.consecutiveMissedPrayers >= 1 ? 'gentle'
        : 'encouraging',
    };
  } catch (err) {
    console.error('[AI] Generation failed:', err.message);
    return {
      success: false,
      error: err.message,
      // Fallback messages when AI is unavailable
      fallback: getFallbackMessage(contextType, userContext),
    };
  }
}

/**
 * Fallback messages when AI is offline — still useful and authentic
 */
function getFallbackMessage(contextType, ctx = {}) {
  const messages = {
    prayer_reminder: [
      `🕌 Time for ${ctx.nextPrayer || 'prayer'} draws near. The Prophet ﷺ said: "The coolness of my eyes was in prayer." (Nasai) Take a moment for your Creator.`,
      `✨ ${ctx.nextPrayer || 'Prayer'} time approaching. Allah says: "Indeed, prayer prohibits immorality and wrongdoing." (Quran 29:45)`,
    ],
    prayer_completed: [
      `🤲 Masha'Allah! ${ctx.prayerName} completed. One more brick in your spiritual home. The Prophet ﷺ said: "The first deed judged is prayer — if it's sound, all is sound." (Tabarani)`,
    ],
    prayer_missed_check: [
      `🕊️ Haven't marked ${ctx.prayerName} yet? It's never too late. Allah says: "And whoever does good, it is for their own soul." (Quran 45:15) Just one step.`,
    ],
    daily_ayah: [
      `📖 "إِنَّ مَعَ الْعُسْرِ يُسْرًا"\n"Inna ma'al-'usri yusra"\n"Indeed, with hardship comes ease." (Quran 94:6)\n\nThis ayah from Surah Ash-Sharh was revealed in Mecca when the Prophet ﷺ was facing intense opposition. It's a divine guarantee — after every difficulty comes relief. Hold onto that today.`,
    ],
    daily_hadith: [
      `📜 The Prophet ﷺ said: "A good word is charity." (Bukhari & Muslim)\n\nOne powerful way to implement this today: Send an encouraging message to someone who's struggling. Your kind word could be the sadaqah that changes their day — and yours.`,
    ],
  };

  const pool = messages[contextType];
  if (!pool) return [`Assalamu Alaikum! 🌙 Take a moment to remember Allah today.`];
  return [pool[Math.floor(Math.random() * pool.length)]];
}

module.exports = {
  buildSystemPrompt,
  generateBuddyResponse,
};