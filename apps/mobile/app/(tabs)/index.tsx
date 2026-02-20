import React, { useState, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import type { Message } from "@camper/shared-types";
import { ChatBubble, ChatInput, QuickActions, theme } from "@camper/ui";
import { RichContent } from "../../components/RichContent";
import { sampleMessages } from "../../components/mock-data";

export default function HomeScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const flatListRef = useRef<FlatList<Message>>(null);

  const handleSend = useCallback(
    (text: string) => {
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: "conv-001",
        role: "user",
        content: text,
        richContent: null,
        toolCalls: null,
        toolResults: null,
        createdAt: new Date(),
      };
      console.log("[Camper] Sending message:", text);

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        conversationId: "conv-001",
        role: "assistant",
        content: `Thanks for your message! I'm a demo assistant. You said: "${text}". In the full app, I'd search for campsites, manage alerts, and help plan your trip.`,
        richContent: null,
        toolCalls: null,
        toolResults: null,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    },
    [],
  );

  const quickActions = [
    {
      label: "Search campsites",
      onPress: () => {
        handleSend("Search campsites near Yosemite");
      },
    },
    {
      label: "Check my alerts",
      onPress: () => {
        handleSend("Check my alerts");
      },
    },
    {
      label: "Plan a trip",
      onPress: () => {
        handleSend("Help me plan a camping trip");
      },
    },
  ];

  const handleCampsitePress = useCallback(
    (id: string) => {
      router.push(`/campsite/${id}` as any);
    },
    [router],
  );

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble
        role={item.role as "user" | "assistant"}
        content={item.content}
        timestamp={item.createdAt}
      >
        {item.richContent?.map((rc, idx) => (
          <RichContent
            key={`${item.id}-rich-${idx}`}
            content={rc}
            onCampsitePress={handleCampsitePress}
          />
        ))}
      </ChatBubble>
    ),
    [handleCampsitePress],
  );

  const showQuickActions = messages.length <= 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          showQuickActions ? (
            <View style={styles.quickActionsWrapper}>
              <QuickActions actions={quickActions} />
            </View>
          ) : null
        }
      />
      <ChatInput onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
  quickActionsWrapper: {
    paddingVertical: theme.spacing.md,
  },
});
