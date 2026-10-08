import { Platform, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import {
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import { LayoutDashboard, Users, Wallet, CalendarDays } from "lucide-react-native";

import { usesNativeTabs } from "@/src/navigation";
import { colors } from "@/src/theme";

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
          <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="siswa">
          <NativeTabs.Trigger.Icon sf="person.3.fill" />
          <NativeTabs.Trigger.Label>Siswa</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="cashflow">
          <NativeTabs.Trigger.Icon sf="banknote.fill" />
          <NativeTabs.Trigger.Label>Cashflow</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="jadwal">
          <NativeTabs.Trigger.Icon sf="calendar" />
          <NativeTabs.Trigger.Label>Jadwal</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarStyle: isDesktop
          ? { display: "none" }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              ...(Platform.OS === "web" ? { height: 64 } : {}),
            },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
          tabBarButtonTestID: "tab-dashboard",
        }}
      />
      <Tabs.Screen
        name="siswa"
        options={{
          title: "Siswa",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          tabBarButtonTestID: "tab-siswa",
        }}
      />
      <Tabs.Screen
        name="cashflow"
        options={{
          title: "Cashflow",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          tabBarButtonTestID: "tab-cashflow",
        }}
      />
      <Tabs.Screen
        name="jadwal"
        options={{
          title: "Jadwal",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
          tabBarButtonTestID: "tab-jadwal",
        }}
      />
    </Tabs>
  );
}
