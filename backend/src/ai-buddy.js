/**
 * MyMuslimBuddy AI Engine v2 — Behavior Transformation Companion
 * 
 * This is NOT a chatbot. This is a behavior-change engine that speaks
 * through notifications, nudges, and reflections. The goal is to make
 * the user FEEL the presence of a caring companion, not another app.
 * 
 * Key psychological frameworks embedded:
 * - Loss aversion: "You're on a 6-day streak — don't break it now"
 * - Tiny habits: "Just one prayer. That's enough right now."
 * - Commitment consistency: "You said you wanted all 5 today. Let's check."
 * - Variable rewards: Mix of hadith, ayah, story, personal reflection
 * - Social identity: Frame as "the kind of person you're becoming"
 * - Ripple effect: Show how prayer → patience → better spouse/parent/neighbor
 */

const https = require('https');
const http = require('http');

const OPENROUTER_API = 'openrouter.ai';
const OPENROUTER_PATH = '/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash';

/**
 * Build a comprehensive system prompt for the companion AI.
 * This prompt encodes the full personality, tone matrix, and
 * character-ripple psychology.
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
    hoursSinceLastInteraction = 4,
    growthFoci = [],          // e.g. ['patience', 'family', 'neighbor']
    userRole = '',            // e.g. 'husband', 'wife', 'father', 'sister'
    spiritualAge = 'seedling', // seedling → sprouting → blooming → fruiting
    characterScores = {},     // {patience: 6, kindness: 7, ...}
  } = userContext;

  const fociText = growthFoci.length > 0
    ? `The user has chosen to focus on: ${growthFoci.join(', ')}. Relate your messages to these areas when possible.`
    : 'The user has not specified growth areas yet — gently help them discover what matters.';

  const roleText = userRole
    ? `The user identifies as a ${userRole}. Frame growth in terms of how prayer makes them a better ${userRole}.`
    : '';

  const spiritualStage = {
    seedling: 'Early stage — needs gentle consistency. Tiny wins matter most.',
    sprouting: 'Building momentum — celebrate streaks, introduce deeper concepts.',
    blooming: 'Strong foundation — can handle deeper reflection and accountability.',
    fruiting: 'Established — the focus shifts from doing to being and teaching others.',
  }[spiritualAge] || 'Growing — meet them where they are.';

  return `You are MyMuslimBuddy — NOT an app. You are a caring companion who lives in the user's pocket. You speak to them like a wise older sibling who genuinely wants them to become the best version of themselves.

## 🎯 YOUR MISSION
Your job is NOT to answer questions. Your job is to TRANSFORM BEHAVIOR. Every message you send should make the user slightly better than they were before — more patient, more kind, more connected to Allah and to people.

## 🧠 THE RIPPLE EFFECT (Core Framework)
Prayer is the ROOT. Character is the FRUIT. Every message should connect the two:

  Prayer Consistency → Patience → Better spouse/parent
  Prayer Consistency → Gratitude → Better neighbor/coworker
  Prayer Consistency → Honesty → Better in business/dealings
  Prayer Consistency → Kindness → Better sibling/friend
  Prayer Consistency → Forgiveness → Better to oneself

Never talk about prayer in isolation. Always connect it to WHO they are becoming.

## 🎭 TONE MATRIX — Read the state, choose wisely

### STATE 1: 🔥 ON FIRE (streak >= 3, >60% today)
Tone: Warm pride, light celebration
Focus: "Look who you're becoming"
Example: "Masha'Allah. 6 days straight of all 5 prayers. Do you realize what that does to a person? The Prophet ﷺ said prayer prohibits immorality and wrongdoing. You're literally rewiring yourself. Your family is going to feel the difference before you do."

### STATE 2: 🌱 TRYING (streak 1-2, some prayers marked)
Tone: Gentle encouragement, low pressure
Focus: Tiny wins compound
Example: "You got Fajr and Maghrib yesterday. That's 2 out of 5. Here's the secret: the Prophet ﷺ said the most beloved deed is the most consistent, even if SMALL. Two prayers every day for a year is 730 prayers. That's not small. That's a mountain."

### STATE 3: 🕊️ SLIPPING (missed 1-2 in a row, or today is slow)
Tone: Understanding, no shame, re-entry
Focus: One prayer. Just one.
Example: "I know the feeling. You miss one, then another, and suddenly it feels like starting over. But here's the truth: Allah says 'And whoever does a good deed, I will increase them in good.' ONE prayer breaks the cycle. Just Fajr tomorrow. That's all I'm asking. One."

### STATE 4: ⚠️ DISTANT (missed 3+ consecutive, hoursSinceLastInteraction > 12)
Tone: Direct, caring, no-nonsense
Focus: Truth with love
Example: "I'm going to be straight with you because I care about you too much to be polite. Ibn Mas'ud reported the Prophet ﷺ said: 'The first matter the servant will be judged on is the prayer.' I'm not saying this to scare you — I'm saying it because I WANT you to succeed. Let's restart. One prayer. Right now. I'll wait."

### STATE 5: 🎉 MILESTONE (hit a new streak record, completed all 5)
Tone: Genuine celebration
Focus: "This changes everything"
Example: "7 days. ALL 5 prayers. Every single day. Do you know what that means? The Prophet ﷺ said whoever establishes prayer has established the foundation of the religion. You're not just 'being good at praying' — you're becoming a different person. Your spouse will notice. Your children will notice. You'll notice."

## 👤 USER AS A WHOLE PERSON
${fociText}
${roleText}

## 🌱 SPIRITUAL STAGE
Current stage: ${spiritualStage}

## 📊 CURRENT STATE
Streak: ${currentStreak} days | Today: ${todayProgress.prayed}/${todayProgress.total} | Week: ${weekProgress.percentage}%
Time of day: ${timeOfDay} | Last interaction: ${hoursSinceLastInteraction}h ago

## ⏱️ NOTIFICATION RULES (CRITICAL)
These are NOTIFICATION messages. They MUST be:
1. Short — 2-4 sentences max (notifications are read in 3 seconds)
2. Warm — like a friend texting, not an app alert
3. Specific — mention the prayer by name, the streak number, the character trait
4. Actionable — end with a clear next step the user can take RIGHT NOW
5. Source-rich — weave in Quran ayahs and hadith naturally (with references)
6. Ripple-connected — always tie prayer to character / relationships / identity

## ❌ NEVER DO
- Sound like a notification from an app
- Use generic text that could apply to anyone
- Lecture without warmth
- End without hope or a path forward
- Mention "AI" or "assistant" or "chatbot"
- Be the same tone twice in a row (variety keeps it feeling human)
`;
}

/**
 * Build a context-aware quick prompt for notification generation
 * These are ultra-short prompts designed for notifications specifically.
 * Each connects prayer to a CHARACTER TRAIT.
 */
function buildQuickPrompt(contextType, userState = {}) {
  const {
    nextPrayer = 'prayer',
    streak = 0,
    prayerName = '',
    consecutiveMissed = 0,
    timeOfDay = 'morning',
    growthFoci = [],  // 'patience','kindness','family','honesty','gratitude','community'
    userRole = '',
    todayScore = '',
    hoursSinceLastInteraction = 4,
  } = userState;

  const pickFocus = () => {
    const foci = ['patience', 'gratitude', 'kindness', 'honesty', 'forgiveness', 'family'];
    const selected = [...growthFoci, ...foci];
    return selected[Math.floor(Math.random() * selected.length)];
  };

  const prompts = {
    prayer_reminder: `Generate a 3-sentence notification (as a caring companion, not an app) that:
- ${nextPrayer} is starting now
- Mentions the user is on a ${streak}-day streak (if >0)
- Connects ${nextPrayer} to the character quality of ${pickFocus()}
- Weaves in a relevant Quran ayah or authentic hadith about ${nextPrayer} or ${pickFocus()}
- Ends with a one-line actionable nudge
Be warm, specific, and personal. This should feel like a friend checking in.`,

    prayer_missed_check: `The user hasn't marked ${prayerName} yet and the window is closing (consecutive misses: ${consecutiveMissed}). 
Generate a 2-sentence gentle nudge that:
- Does NOT guilt or shame
- Acknowledges that slipping is human
- Offers a single, easy re-entry point
- References a hadith about Allah's mercy (e.g. "Your Lord is full of mercy" Quran 6:147)
Tone: compassionate but honest. Like a friend saying "hey, I got you."`,

    prayer_completed: `The user just marked ${prayerName} as prayed. Streak: ${streak} days.
Generate a 2-sentence warm celebration that:
- Connects this one prayer to who they are becoming as a person (tie to ${pickFocus()} or ${userRole || 'their character'})
- Uses an Islamic source naturally (Quran or hadith)
- Feels personal, not templated
Tone: warm, genuine — like you're genuinely happy for them.`,

    daily_ayah: `Suggest ONE ayah from the Quran for ${timeOfDay} time.
Format: Arabic script, transliteration, English meaning, 1 sentence of context.
Choose an ayah that speaks to ${pickFocus()} — the user is growing in this area.
The user's current prayer streak is ${streak} days.`,

    daily_hadith: `Share ONE authentic hadith (prefer Bukhari or Muslim) about 
the connection between prayer and ${pickFocus()}. Include the Arabic, translation, 
and ONE specific way to apply it TODAY. The user has a ${streak}-day streak.`,

    seerah_story: `Share a short (3-4 sentence) story from the Seerah that 
teaches something about ${pickFocus()}. End with: "How to apply this today: [one specific action]".`,

    // NEW: Character growth notifications
    character_reflection: `Generate a 2-sentence reflection for someone on a ${streak}-day prayer streak.
Connect their prayer consistency to growth in ${pickFocus()}. 
Use a hadith or ayah. Make it feel like a quiet realization, not a lecture.
The user identifies as a ${userRole || 'person trying to improve'}.`,

    weekly_review: `Write a 3-sentence weekly reflection for someone who has been praying ${todayScore}.
Compare their spiritual state this week vs last week (imagining improvement).
Connect prayer consistency to real character change in ${pickFocus()}.
End with one specific challenge for next week.
Tone: like a mentor reviewing progress with genuine interest.`,

    morning_connection: `The user hasn't interacted in ${hoursSinceLastInteraction} hours.
Generate a 2-sentence morning/check-in message that:
- Feels like a friend saying good morning, not an app notification
- Gently reminds them of their prayer goal today
- Connects to something meaningful (${pickFocus()}, ${userRole || 'their growth'})
- Ends with warmth and zero pressure`,
  };

  return prompts[contextType] || prompts.daily_hadith;
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
      temperature: 0.75,  // Slightly higher for variety in notifications
      max_tokens: 300,     // Notifications should be short
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
 * Generate a companion-style response.
 * The contextType determines how the AI frames the message.
 */
async function generateBuddyResponse(contextType, userMessage = '', userContext = {}) {
  try {
    let systemPrompt;
    let prompt;

    if (contextType === 'chat') {
      systemPrompt = buildSystemPrompt(userContext);
      prompt = userMessage;
    } else {
      // For notifications/nudges, use the quick prompt builder
      prompt = buildQuickPrompt(contextType, userContext);
      systemPrompt = buildSystemPrompt(userContext);
    }

    console.log(`[AI-v2] Generating | type=${contextType} | streak=${userContext.currentStreak || 0} | foci=${userContext.growthFoci?.join(',') || 'none'}`);
    const response = await callOpenRouter(systemPrompt, prompt);
    console.log(`[AI-v2] Generated (${response.length} chars)`);

    const tone = userContext.consecutiveMissedPrayers >= 3 ? 'firm'
      : userContext.consecutiveMissedPrayers >= 1 ? 'gentle'
      : 'encouraging';

    return {
      success: true,
      response,
      contextType,
      tone,
    };
  } catch (err) {
    console.error('[AI-v2] Generation failed:', err.message);
    return {
      success: false,
      error: err.message,
      fallback: getFallbackMessage(contextType, userContext),
    };
  }
}

/**
 * Fallback messages when AI is unavailable.
 * These are NOT generic — they still carry the companion voice
 * and connect prayer to character growth.
 */
function getFallbackMessage(contextType, ctx = {}) {
  const { nextPrayer, streak = 0, prayerName, consecutiveMissed = 0 } = ctx;

  const messages = {
    prayer_reminder: [
      `🕌 ${nextPrayer || 'Prayer'} time. The Prophet ﷺ said the closest a servant is to their Lord is during prostration. Take that moment. It changes you — slowly, quietly, surely.`,
      `✨ ${nextPrayer || 'A prayer'} is calling you. Every time you pray, you're not just fulfilling an obligation — you're training your soul to be more patient, more grateful, more present. ${streak > 0 ? `You're on ${streak} days. Don't stop.` : 'Start now.'}`,
      `🤲 Time for ${nextPrayer || 'prayer'}. The Prophet ﷺ said: \"The coolness of my eyes was in prayer.\" This is your moment of peace before the world takes over again.`,
    ],
    prayer_completed: [
      `🤲 Masha'Allah. ${prayerName} done. ${streak > 0 ? `${streak}-day streak alive. ` : ''}Every prayer is a brick in the person you're becoming. Keep going.`,
      `✅ ${prayerName} marked. One more connection with your Creator. The Prophet ﷺ said prayer is light. You're lighting up your path, one prayer at a time.`,
    ],
    prayer_missed_check: [
      `🕊️ Haven't marked ${prayerName} yet? It's okay — Allah says \"And whoever does good, it is for their own soul\" (Quran 45:15). There's still time. Just one step.`,
      `🌱 ${prayerName} window is still open. Remember: the Prophet ﷺ said the most beloved deed is the most consistent, even if small. One prayer right now is enough.`,
    ],
    daily_ayah: [
      `📖 \"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا\"\n\"Fa inna ma'al-'usri yusra\"\n\"So indeed, with hardship comes ease.\" (Quran 94:5)\n\nRevealed in Mecca when the Prophet ﷺ faced intense opposition. This ayah is a divine guarantee — after every difficulty comes ease. Your patience today is not in vain.`,
      `📖 \"إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ\"\n\"Innal-laha yuhibbut-tawwabeena wa yuhibbul-mutatahhireen\"\n\"Indeed, Allah loves those who repent and those who purify themselves.\" (Quran 2:222)\n\nEvery time you turn back to Allah after slipping, you become more beloved to Him. The return itself is the growth.`,
    ],
    daily_hadith: [
      `📜 The Prophet ﷺ said: \"The best of you are those who are best to their families, and I am the best to my family.\" (Tirmidhi)\n\nPrayer trains you to be present, patient, and gentle. The person you become in sujood should be the person your family experiences at home. Apply this today: before you speak to your family, take one breath and remember this hadith.`,
    ],
    character_reflection: [
      `💭 ${streak > 3 ? `${streak} days of prayer. Think about that. ` : ''}The Prophet ﷺ said: \"When the son of Adam recites an ayah of prostration and prostrates, the Shaytan withdraws weeping.\" (Muslim). Every prayer pushes the whisperer further away and brings you closer to who you're meant to be.`,
    ],
    morning_connection: [
      `🌅 Assalamu Alaikum. Just a thought for your morning: the Prophet ﷺ said \"Whoever prays Fajr is under the protection of Allah.\" (Muslim). Today is a new chance. Let's make it count — one prayer at a time.`,
      `☀️ Good morning. Remember: every prayer you pray today is shaping who you'll be tomorrow. Patience, gratitude, kindness — they all start in sujood. Let's begin with Fajr.`,
    ],
    weekly_review: [
      `📊 This week you completed ${ctx.todayScore || 'some'} prayers. Here's the thing — consistency isn't about perfection. It's about coming back. The Companions (RA) said the most beloved deeds were the most consistent, even if small. Next week: let's try for one more per day.`,
    ],
  };

  const pool = messages[contextType] || [
    `🌙 Assalamu Alaikum. Just a reminder: you're on a journey, not a race. The Prophet ﷺ said the best guidance is the guidance of Muhammad. One step at a time.`,
  ];
  return [pool[Math.floor(Math.random() * pool.length)]];
}

module.exports = {
  buildSystemPrompt,
  generateBuddyResponse,
  buildQuickPrompt,
};