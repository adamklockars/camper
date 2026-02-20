import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Alert } from "@camper/shared-types";
import { theme } from "../theme";

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
  onPause?: () => void;
  onCancel?: () => void;
}

const statusColors: Record<string, string> = {
  active: theme.colors.success,
  paused: theme.colors.accent[500],
  triggered: theme.colors.info,
  expired: theme.colors.stone[400],
  cancelled: theme.colors.stone[400],
};

const statusLabels: Record<string, string> = {
  active: "Scanning",
  paused: "Paused",
  triggered: "Found!",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function AlertCard({ alert, onPress, onPause, onCancel }: AlertCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[alert.status] }]} />
          <Text style={styles.statusText}>{statusLabels[alert.status]}</Text>
        </View>
        {alert.autoBook && (
          <View style={styles.autoBookBadge}>
            <Text style={styles.autoBookText}>Auto-book</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{alert.campgroundName}</Text>
      <Text style={styles.dates}>
        {alert.startDate} — {alert.endDate}
      </Text>
      {alert.siteTypes.length > 0 && (
        <Text style={styles.types}>{alert.siteTypes.join(", ")}</Text>
      )}

      {alert.status === "active" && (
        <View style={styles.actions}>
          {onPause && (
            <Pressable style={styles.secondaryButton} onPress={onPause}>
              <Text style={styles.secondaryButtonText}>Pause</Text>
            </Pressable>
          )}
          {onCancel && (
            <Pressable style={styles.secondaryButton} onPress={onCancel}>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.error }]}>Cancel</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
    marginVertical: theme.spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.stone[500],
  },
  autoBookBadge: {
    backgroundColor: theme.colors.accent[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  autoBookText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.accent[700],
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  dates: {
    fontSize: 14,
    color: theme.colors.stone[500],
    marginTop: 4,
  },
  types: {
    fontSize: 13,
    color: theme.colors.stone[400],
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.stone[600],
  },
});
