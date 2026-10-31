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
import { X, ArrowUp, ChatCircle } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../../services/ApiClient';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders, shadows } from '../../constants/theme';
import { AthleteAvatar } from '../activity/AthleteAvatar';
import { EmptyState } from '../ui/EmptyState';

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
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

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
        <SafeAreaView style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTextCol}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Comments</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {activityTitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color={colors.textPrimary} weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Comment List */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon={<ChatCircle size={32} color={colors.textSecondary} weight="regular" />}
                title="No comments yet"
                description="Be the first to congratulate the athlete on their effort!"
              />
            }
            renderItem={({ item }) => (
              <View style={[styles.commentRow, { borderBottomColor: colors.borderSubtle }]}>
                <AthleteAvatar
                  name={`${item.user.firstName} ${item.user.lastName}`}
                  avatarUrl={item.user.avatarUrl}
                  size="sm"
                />
                <View style={styles.commentBody}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>
                      {item.user.firstName} {item.user.lastName}
                    </Text>
                    <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Input Bar */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View
              style={[
                styles.inputBar,
                { backgroundColor: colors.surface, borderTopColor: colors.border },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                  shadows.none,
                ]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textMuted}
                value={inputContent}
                onChangeText={setInputContent}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.accent },
                  shadows.none,
                  (!inputContent.trim() || isSubmitting) && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!inputContent.trim() || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ArrowUp size={18} color="#FFFFFF" weight="bold" />
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '75%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.none,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: borders.thin,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    ...typography.heading2,
  },
  headerSub: {
    ...typography.caption,
    marginTop: 2,
    maxWidth: 280,
  },
  closeButton: {
    padding: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexGrow: 1,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: borders.thin,
  },
  commentBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.heading3,
    fontSize: 14,
  },
  commentTime: {
    ...typography.caption,
  },
  commentText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: borders.thin,
  },
  textInput: {
    flex: 1,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
