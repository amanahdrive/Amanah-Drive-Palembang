import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Image, LogBox, Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { ToastHost } from "@/src/components/toast";
import { WebFrame } from "@/src/components/web-frame";
import { queryClient } from "@/src/query-client";

LogBox.ignoreAllLogs(true);

// Prewarm the local logo asset so the first paint on Android/Expo Go
// does not flash a broken image placeholder.
if (Platform.OS !== "web") {
  const source = Image.resolveAssetSource(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../assets/images/logo.jpeg"),
  );
  if (source?.uri) Image.prefetch(source.uri);
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <StatusBar style="dark" />
            <WebFrame>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="student-form"
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen
                  name="transaction-form"
                  options={{ presentation: "modal" }}
                />
              </Stack>
              <ToastHost />
            </WebFrame>
          </KeyboardProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
