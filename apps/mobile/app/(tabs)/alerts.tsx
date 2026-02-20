import React, { useState, useCallback } from "react";
import { View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import type { Alert } from "@camper/shared-types";
import { AlertCard, EmptyState, theme } from "@camper/ui";
import { sampleAlerts } from "../../components/mock-data";

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>(sampleAlerts);

  const handlePause = useCallback((alertId: string) => {
    console.log("[Camper] Pausing alert:", alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "paused" as const } : a)),
    );
  }, []);

  const handleCancel = useCallback((alertId: string) => {
    console.log("[Camper] Cancelling alert:", alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "cancelled" as const } : a)),
    );
  }, []);

  const handleAlertPress = useCallback((alert: Alert) => {
    console.log("[Camper] Alert tapped:", alert.id);
  }, []);

  const handleNewAlert = useCallback(() => {
    console.log("[Camper] New alert tapped");
    // In the full app, this would navigate to alert creation
  }, []);

  const renderAlert = useCallback(
    ({ item }: { item: Alert }) => (
      <AlertCard
        alert={item}
        onPress={() => handleAlertPress(item)}
        onPause={item.status === "active" ? () => handlePause(item.id) : undefined}
        onCancel={item.status === "active" ? () => handleCancel(item.id) : undefined}
      />
    ),
    [handleAlertPress, handlePause, handleCancel],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No availability alerts"
            description="Set up alerts to get notified when your favorite campsites become available."
            actionLabel="Start monitoring"
            onAction={handleNewAlert}
          />
        }
      />

      {/* Floating Action Button */}
      <Pressable style={styles.fab} onPress={handleNewAlert}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    fontWeight: "400",
    color: "#ffffff",
    lineHeight: 30,
  },
});
