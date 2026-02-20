import React from "react";
import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { theme } from "@camper/ui";

/**
 * Simple text-based tab icons.
 * Replace with proper icon components (e.g. @expo/vector-icons) when assets are available.
 */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        styles.icon,
        { color: focused ? theme.colors.primary[600] : theme.colors.stone[400] },
      ]}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.stone[400],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.stone[200],
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: theme.colors.primary[700],
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon label={"\u{1F4AC}"} focused={focused} />,
          headerTitle: "Camper",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => <TabIcon label={"\u{1F50D}"} focused={focused} />,
          headerTitle: "Find Campsites",
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ focused }) => <TabIcon label={"\u{1F4C5}"} focused={focused} />,
          headerTitle: "My Bookings",
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ focused }) => <TabIcon label={"\u{1F514}"} focused={focused} />,
          headerTitle: "Availability Alerts",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon label={"\u{1F464}"} focused={focused} />,
          headerTitle: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 22,
  },
});
