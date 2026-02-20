import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
} from "react-native";
import { theme } from "@camper/ui";

export default function ProfileScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => console.log("[Camper] User signed out"),
      },
    ]);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AK</Text>
        </View>
        <Text style={styles.userName}>Alex Kowalski</Text>
        <Text style={styles.userEmail}>alex@example.com</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>Premium</Text>
        </View>
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Get alerts on your device</Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: theme.colors.stone[300], true: theme.colors.primary[300] }}
            thumbColor={pushNotifications ? theme.colors.primary[600] : theme.colors.stone[100]}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>Booking confirmations and summaries</Text>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: theme.colors.stone[300], true: theme.colors.primary[300] }}
            thumbColor={emailNotifications ? theme.colors.primary[600] : theme.colors.stone[100]}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>SMS Notifications</Text>
            <Text style={styles.settingDescription}>Urgent availability alerts via text</Text>
          </View>
          <Switch
            value={smsNotifications}
            onValueChange={setSmsNotifications}
            trackColor={{ false: theme.colors.stone[300], true: theme.colors.primary[300] }}
            thumbColor={smsNotifications ? theme.colors.primary[600] : theme.colors.stone[100]}
          />
        </View>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Pressable style={styles.menuItem} onPress={() => console.log("[Camper] Manage subscription")}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Manage Plan</Text>
            <Text style={styles.settingDescription}>Premium -- unlimited alerts and auto-booking</Text>
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => console.log("[Camper] Billing history")}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Billing History</Text>
            <Text style={styles.settingDescription}>View past invoices and payments</Text>
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
      </View>

      {/* Camping Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Camping Preferences</Text>
        <Pressable style={styles.menuItem} onPress={() => console.log("[Camper] Preferred regions")}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Preferred Regions</Text>
            <Text style={styles.settingDescription}>Yosemite, Banff, Pacific Northwest</Text>
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => console.log("[Camper] Site types")}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Site Types</Text>
            <Text style={styles.settingDescription}>Tent, Glamping</Text>
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => console.log("[Camper] Group size")}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Default Group Size</Text>
            <Text style={styles.settingDescription}>4 people</Text>
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
      </View>

      {/* Sign Out */}
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      {/* App Version */}
      <Text style={styles.versionText}>Camper v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing["2xl"],
  },
  userSection: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.stone[200],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.stone[500],
    marginTop: 4,
  },
  tierBadge: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.accent[50],
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent[300],
  },
  tierText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.accent[700],
  },
  section: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.stone[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.stone[100],
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.stone[900],
  },
  settingDescription: {
    fontSize: 13,
    color: theme.colors.stone[400],
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.stone[100],
  },
  chevron: {
    fontSize: 18,
    color: theme.colors.stone[400],
    fontWeight: "300",
  },
  signOutButton: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.error,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: theme.colors.stone[400],
    marginTop: theme.spacing.lg,
  },
});
