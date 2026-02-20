import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../theme";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing["2xl"],
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.stone[900],
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: theme.colors.stone[500],
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
