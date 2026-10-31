import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../../services/ApiClient';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

interface CommentModalProps {
  visible: boolean;
  activityId: string | null;
  activityTitle: string;
  comments: CommentItem[];
  onClose: () => void;
  onCommentAdded: (newComment: CommentItem) => void;
}

export function CommentModal({
  visible,
  activityId,
  activityTitle,
  comments,
  onClose,
  onCommentAdded,
}: CommentModalProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!activityId || !inputContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await ApiClient.addComment(activityId, inputContent.trim());
      setInputContent('');
      if (res.comment) {
        onCommentAdded(res.comment);
      }
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err: any) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.backdrop}>
        <SafeAreaView style={[styles.sheetContainer, { backgroundColor: theme.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Comments</Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {activityTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Comment List */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={36} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No comments yet. Be the first to congratulate the athlete!
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.commentRow, { borderBottomColor: theme.cardBorder }]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>
                    {item.user.firstName?.[0]}
                    {item.user.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: theme.text }]}>
                      {item.user.firstName} {item.user.lastName}
                    </Text>
                    <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, { color: theme.text }]}>{item.content}</Text>
                </View>
              </View>
            )}
          />

          {/* Input Bar */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.inputBar, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text, backgroundColor: theme.card }]}
                placeholder="Add a comment..."
                placeholderTextColor={theme.textSecondary}
                value={inputContent}
                onChangeText={setInputContent}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputContent.trim() || isSubmitting) && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!inputContent.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 260,
  },
  closeButton: {
    padding: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 240,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  commentBody: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 90,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
