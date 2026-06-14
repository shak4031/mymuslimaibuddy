const express = require('express');
const router = express.Router();

// Curated Hadith collection with practical applications
const HADITH_DATA = [
  {
    id: 1,
    arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ',
    translation: 'Actions are judged by intentions.',
    source: 'Sahih Bukhari & Sahih Muslim',
    sourceArabic: 'صحيح البخاري ومسلم',
    topic: 'intention',
    explanation: 'This foundational hadith teaches that the value of any action depends on the intention behind it. A simple deed done for Allah\'s sake can be greater than a grand one done for show.',
    implementation: 'Before any action today, pause for one second and silently say "Bismillah, for Allah." This transforms routine tasks into worship.',
  },
  {
    id: 2,
    arabic: 'مَنْ لَا يَشْكُرُ النَّاسَ لَا يَشْكُرُ اللَّهَ',
    translation: 'Whoever is not grateful to people is not grateful to Allah.',
    source: 'Sunan Abi Dawud & Tirmidhi',
    sourceArabic: 'سنن أبي داود والترمذي',
    topic: 'gratitude',
    explanation: 'Gratitude to Allah and gratitude to people are connected. Acknowledging the kindness of others — even with a simple "thank you" — is part of faith.',
    implementation: 'Today, sincerely thank three people — family, a coworker, a shopkeeper. Notice how it elevates your mood and theirs.',
  },
  {
    id: 3,
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ',
    translation: 'Your smile for your brother is charity.',
    source: 'Jami at-Tirmidhi',
    sourceArabic: 'جامع الترمذي',
    topic: 'kindness',
    explanation: 'Even a smile is an act of charity — a rewardable deed that costs nothing. Islam makes kindness accessible to everyone, regardless of wealth.',
    implementation: 'Challenge yourself: smile at everyone you meet today, even if you\'re busy or stressed. Watch how it changes interactions.',
  },
  {
    id: 4,
    arabic: 'الْكَيِّسُ مَنْ دَانَ نَفْسَهُ وَعَمِلَ لِمَا بَعْدَ الْمَوْتِ',
    translation: 'The intelligent person is one who holds themselves accountable and works for what comes after death.',
    source: 'Jami at-Tirmidhi',
    sourceArabic: 'جامع الترمذي',
    topic: 'self_accountability',
    explanation: 'True intelligence isn\'t worldly cleverness — it\'s the ability to pause, reflect on your actions, and prepare for the Hereafter.',
    implementation: 'Take 2 minutes before bed tonight. Ask yourself: "What did I do today that will benefit me in the next life?" Just noticing is the first step.',
  },
  {
    id: 5,
    arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    translation: 'None of you truly believes until he loves for his brother what he loves for himself.',
    source: 'Sahih Bukhari & Muslim',
    sourceArabic: 'صحيح البخاري ومسلم',
    topic: 'brotherhood',
    explanation: 'This hadith sets the standard for the Muslim community: genuine faith requires wanting good for others as much as you want it for yourself.',
    implementation: 'Is there someone you\'re competing with or resentful of? Make dua for them today — ask Allah to bless them in the exact way you want to be blessed.',
  },
  {
    id: 6,
    arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    translation: 'A Muslim is one from whose tongue and hand other Muslims are safe.',
    source: 'Sahih Bukhari',
    sourceArabic: 'صحيح البخاري',
    topic: 'community',
    explanation: 'Being a Muslim isn\'t just about rituals — it\'s about being safe to be around. Your words and actions should bring peace, not harm.',
    implementation: 'Before speaking today, ask: "Is this true? Is it kind? Is it necessary?" If it fails any check, stay silent.',
  },
  {
    id: 7,
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    translation: 'Whoever treads a path seeking knowledge, Allah makes the path to Paradise easy for them.',
    source: 'Sahih Muslim',
    sourceArabic: 'صحيح مسلم',
    topic: 'knowledge',
    explanation: 'Seeking Islamic knowledge isn\'t just for scholars — every step you take to learn more about your deen is a step toward Jannah.',
    implementation: 'Learn one new thing about your deen today. Read the explanation of one ayah, one hadith, or one attribute of Allah.',
  },
  {
    id: 8,
    arabic: 'أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    translation: 'The most beloved deeds to Allah are the most consistent, even if small.',
    source: 'Sahih Bukhari & Muslim',
    sourceArabic: 'صحيح البخاري ومسلم',
    topic: 'consistency',
    explanation: 'You don\'t need to do grand acts of worship. Allah loves the small deed you do regularly over the big one you do once and abandon.',
    implementation: 'Pick ONE small act: 2 rak\'at of sunnah, reading 1 page of Quran, or 5 minutes of dhikr. Do it at the same time every day this week.',
  },
  {
    id: 9,
    arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    translation: 'Dua is worship.',
    source: 'Jami at-Tirmidhi',
    sourceArabic: 'جامع الترمذي',
    topic: 'dua',
    explanation: 'Making dua isn\'t just asking Allah for things — it\'s an act of worship that acknowledges our dependence on Him.',
    implementation: 'Take 2 minutes after the next prayer to make dua. Start with gratitude, then ask for what matters most.',
  },
  {
    id: 10,
    arabic: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    translation: 'Be conscious of Allah wherever you are. Follow a bad deed with a good deed and it will erase it. And interact with people with good character.',
    source: 'Jami at-Tirmidhi',
    sourceArabic: 'جامع الترمذي',
    topic: 'character',
    explanation: 'Three profound pieces of advice in one hadith: God-consciousness at all times, immediate repentance after a sin, and good character with everyone.',
    implementation: 'If you make a mistake today, don\'t spiral. Immediately do something good — give a smile, make wudu, pray 2 rak\'at. That good deed wipes it out.',
  },
  {
    id: 11,
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    translation: 'Whoever believes in Allah and the Last Day, let them speak good or remain silent.',
    source: 'Sahih Bukhari & Muslim',
    sourceArabic: 'صحيح البخاري ومسلم',
    topic: 'speech',
    explanation: 'A simple but powerful filter for your speech — if your words won\'t bring good, silence is the better choice.',
    implementation: 'Try "silent hour" for one hour today. Only speak if it\'s necessary or beneficial. Notice how much unnecessary talk you usually engage in.',
  },
  {
    id: 12,
    arabic: 'إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ',
    translation: 'Allah does not look at your appearance or wealth, but He looks at your hearts and your deeds.',
    source: 'Sahih Muslim',
    sourceArabic: 'صحيح مسلم',
    topic: 'heart',
    explanation: 'In a world obsessed with appearance and status, this hadith redirects our focus to what truly matters: the state of our heart and the sincerity of our actions.',
    implementation: 'When you catch yourself comparing your life to others\' on social media, repeat this hadith. Remind yourself: Allah looks at the heart, not the highlight reel.',
  },
];

// Stories from the Seerah (life of Prophet Muhammad ﷺ)
const SEERAH_STORIES = [
  {
    id: 1,
    title: 'The First Revelation',
    period: 'Meccan',
    year: '610 CE',
    story: 'The Prophet ﷺ was 40 years old, meditating in the Cave of Hira when Angel Jibril appeared and commanded: "Iqra! (Read!)." The Prophet, who was unlettered, replied "I cannot read." Three times the angel embraced him and commanded, and three times he replied the same. Finally, Jibril recited the first five verses of Surah Al-Alaq: "Read in the name of your Lord who created — created man from a clot. Read, and your Lord is the Most Generous." Trembling, the Prophet ﷺ rushed home to Khadijah (RA) saying "Cover me! Cover me!" Khadijah (RA) comforted him and became the first person to accept Islam.',
    lesson: 'Allah chose an unlettered man to deliver His final message — proving the Quran is divine, not composed by the Prophet ﷺ. Khadijah\'s immediate faith and comfort teaches us the power of supporting loved ones in their moment of need.',
    application: 'Today, when someone you love is scared or uncertain, be their Khadijah. Believe in them first. Comfort them first. Ask questions later.',
  },
  {
    id: 2,
    title: 'The Boycott of Banu Hashim',
    period: 'Meccan',
    year: '616-619 CE',
    story: 'When the Quraysh couldn\'t stop the Prophet ﷺ, they boycotted his entire clan, Banu Hashim. For three years, Muslims were confined to a valley called Shi\'b Abi Talib, cut off from food, water, and trade. They survived on leaves and leather. The boycott only ended when some Quraysh leaders, moved by family ties, tore up the agreement. The Prophet ﷺ emerged with his faith unshaken, though he had lost his beloved wife Khadijah and his uncle Abu Talib that same year — the Year of Sorrow.',
    lesson: 'The Prophet ﷺ endured three years of starvation and isolation without abandoning his mission. He lost two of his greatest supporters in the same year — yet he didn\'t stop. When you feel alone in your faith, remember: the Prophet ﷺ was once completely alone, and Allah was enough for him.',
    application: 'If you feel isolated in practicing Islam — at work, school, or even in your own home — don\'t despair. The Prophet ﷺ endured far greater isolation for far longer. Your small stand matters.',
  },
  {
    id: 3,
    title: 'The Night Journey (Isra wal Miraj)',
    period: 'Meccan',
    year: '621 CE',
    story: 'After the Year of Sorrow, Allah gave the Prophet ﷺ the ultimate gift. In one night, Jibril took him from Makkah to Jerusalem (Isra) on Buraq, where he led all the prophets in prayer at Al-Aqsa. Then he ascended through the seven heavens (Miraj), meeting Adam, Isa, Yahya, Yusuf, Idris, Harun, Musa, and Ibrahim (peace be upon them all). At Sidrat al-Muntaha, he received the command of 50 daily prayers, which was reduced to 5 after Moses\' advice — but the reward remains as 50.',
    lesson: 'When Allah takes something from you, He gives you something far greater. The Prophet lost Khadijah and Abu Talib — and Allah gave him the heavens. The five daily prayers are a direct gift from that night, a daily connection to the Divine.',
    application: 'Your five daily prayers are more than a ritual — they are a gift from the night the Prophet ﷺ stood before Allah. Every time you pray, you\'re connecting to that blessed journey.',
  },
  {
    id: 4,
    title: 'The Hijrah — Migration to Medina',
    period: 'Medinan',
    year: '622 CE',
    story: 'When the persecution in Makkah became unbearable and a plot to assassinate the Prophet ﷺ was hatched, Allah commanded the Muslims to migrate to Yathrib (Medina). The Prophet ﷺ and Abu Bakr (RA) hid in the Cave of Thawr for three days. Their pursuers stood at the mouth of the cave, but Abu Bakr trembled. The Prophet said: "Do not fear, Allah is with us." A spider spun a web and a dove nested at the cave entrance, convincing the Quraysh the cave was empty. This was the beginning of the Islamic calendar.',
    lesson: 'Trust in Allah doesn\'t mean doing nothing — the Prophet ﷺ planned meticulously (leaving Ali in his bed, hiring a guide, taking a different route). But after planning, he trusted completely. "Allah is with us" — the most powerful declaration of faith in a moment of crisis.',
    application: 'When facing a difficult decision, plan carefully — then put your complete trust in Allah. The same Allah who sent a spider and a dove to protect His Prophet is with you.',
  },
  {
    id: 5,
    title: 'The Conquest of Makkah',
    period: 'Medinan',
    year: '630 CE (8 AH)',
    story: 'After the Treaty of Hudaybiyyah was broken, the Prophet ﷺ marched to Makkah with 10,000 Companions — an army that had left as refugees eight years earlier. The Quraysh expected revenge. But when the Prophet ﷺ entered the city, he declared general amnesty: "Go, you are free." He destroyed the 360 idols around the Kaaba, reciting "Truth has come and falsehood has vanished" (Quran 17:81). The man who had been persecuted, boycotted, and plotted against forgave everyone.',
    lesson: 'Power doesn\'t corrupt when you have true faith. The Prophet ﷺ had absolute power over his enemies and chose absolute forgiveness. This is the highest moral standard in human history.',
    application: 'Is there someone you\'ve been holding a grudge against? Today, forgive them. Not because they deserve it, but because you\'re following the example of the best of creation.',
  },
];

// Search hadith by keyword or topic
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, error: 'Search query required' });
  }

  const query = q.toLowerCase();
  const results = HADITH_DATA.filter(h =>
    h.translation.toLowerCase().includes(query) ||
    h.topic.toLowerCase().includes(query) ||
    h.explanation.toLowerCase().includes(query)
  );

  res.json({
    success: true,
    data: results.slice(0, 10), // Max 10 results
  });
});

// Get random daily hadith
router.get('/daily', (req, res) => {
  const hadith = HADITH_DATA[Math.floor(Math.random() * HADITH_DATA.length)];
  res.json({ success: true, data: { ...hadith, type: 'hadith' } });
});

// Get random seerah story
router.get('/seerah/daily', (req, res) => {
  const story = SEERAH_STORIES[Math.floor(Math.random() * SEERAH_STORIES.length)];
  res.json({ success: true, data: { ...story, type: 'seerah' } });
});

// Get all hadith by topic
router.get('/topic/:topic', (req, res) => {
  const { topic } = req.params;
  const results = HADITH_DATA.filter(h => h.topic === topic);
  res.json({ success: true, data: results });
});

// Get all seerah stories
router.get('/seerah/all', (req, res) => {
  res.json({ success: true, data: SEERAH_STORIES });
});

// Get all topics
router.get('/topics', (req, res) => {
  const topics = [...new Set(HADITH_DATA.map(h => h.topic))];
  res.json({ success: true, data: topics });
});

module.exports = router;