import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider, createTRPCReact } from "@camper/api-client";
import { theme } from "@camper/ui";

// TODO: import type { AppRouter } from "@camper/api/src/router" for full type safety
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<any>();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/trpc";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TRPCProvider apiUrl={API_URL} trpc={trpc}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary[700],
            },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontWeight: "700",
            },
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="campsite/[id]"
            options={{
              title: "Campsite Details",
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen
            name="booking/confirm"
            options={{
              title: "Confirm Booking",
              headerBackTitle: "Back",
              presentation: "modal",
            }}
          />
        </Stack>
      </TRPCProvider>
    </SafeAreaProvider>
  );
}
