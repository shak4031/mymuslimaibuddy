import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { api } from '../../src/services/api';

type Message = {
  id: string;
  role: 'user' | 'buddy';
  text: string;
  timestamp: Date;
  tone?: string;
  context?: any;
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'buddy',
  text: "Assalamu Alaikum! 🌙 I'm your Muslim Buddy. I'm here to help you on your journey — whether it's prayer, Quran, hadith, or anything about Islam. What's on your mind today?",
  timestamp: new Date(),
};

export default function BuddyScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>({ streak: 0, todayProgress: '0/5', weekProgress: '0%', quranProgress: '0%' });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load initial context
    loadContext();
  }, []);

  async function loadContext() {
    try {
      const result = await api.getTodayPrayers('default-device');
      if (result.success) {
        setContext({
          streak: result.data.streak,
          todayProgress: `${result.data.progress.prayed}/${result.data.progress.total}`,
          weekProgress: `${result.data.progress.percentage}%`,
          quranProgress: '0%',
        });
      }
    } catch (e) { /* offline */ }
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText('');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await api.chat('default-device', text);
      if (result.success) {
        const buddyMsg: Message = {
          id: `buddy-${Date.now()}`,
          role: 'buddy',
          text: result.data.response,
          timestamp: new Date(),
          tone: result.data.tone,
          context: result.data.context,
        };
        setMessages(prev => [...prev, buddyMsg]);
        if (result.data.context) setContext(result.data.context);
      } else {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'buddy',
          text: "Sorry, I couldn't respond right now. Please check your connection and try again.",
          timestamp: new Date(),
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'buddy',
        text: "I'm having trouble connecting right now. Don't worry — keep me in mind and we can talk later, insha'Allah.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.buddyRow]}>
        {!isUser && (
          <View style={styles.buddyAvatar}>
            <Text style={styles.buddyAvatarText}>🤲</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.buddyBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.buddyText]}>
            {item.text}
          </Text>
          {item.tone && !isUser && (
            <View style={styles.toneBadge}>
              <Text style={styles.toneText}>
                {item.tone === 'firm' ? '💪 Direct' : item.tone === 'gentle' ? '🕊️ Gentle' : '❤️ Encouraging'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Quick suggestions
  const suggestions = [
    'Give me a daily reminder',
    'What was the Isra wal Miraj?',
    'I need motivation for prayer',
    'Share a hadith about patience',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Context Bar */}
      <View style={styles.contextBar}>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>Streak</Text>
          <Text style={styles.contextValue}>{context.streak}</Text>
        </View>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>Today</Text>
          <Text style={styles.contextValue}>{context.todayProgress}</Text>
        </View>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>Week</Text>
          <Text style={styles.contextValue}>{context.weekProgress}</Text>
        </View>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>Quran</Text>
          <Text style={styles.contextValue}>{context.quranProgress}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={
          messages.length <= 1 ? (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setInputText(s);
                  }}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your buddy anything..."
          placeholderTextColor="#95A5A6"
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F0',
  },
  contextBar: {
    flexDirection: 'row',
    backgroundColor: '#1B4332',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  contextItem: {
    flex: 1,
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 10,
    color: '#A3D4B5',
    fontWeight: '500',
  },
  contextValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
    marginTop: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  buddyRow: {
    justifyContent: 'flex-start',
  },
  buddyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  buddyAvatarText: { fontSize: 18 },
  messageBubble: {
    maxWidth: '78%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#2D6A4F',
    borderBottomRightRadius: 4,
  },
  buddyBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: { color: '#fff' },
  buddyText: { color: '#212529' },
  toneBadge: {
    marginTop: 8,
  },
  toneText: {
    fontSize: 11,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  suggestions: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 8,
    fontWeight: '500',
  },
  suggestionChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  suggestionText: {
    color: '#2D6A4F',
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#212529',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C8E6C9',
  },
});