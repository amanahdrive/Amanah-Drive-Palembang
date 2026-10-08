import { Platform } from "react-native";
import { Tabs } from "expo-router";
import {
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import { LayoutDashboard, Users, Wallet, UserCircle2 } from "lucide-react-native";

import { usesNativeTabs } from "@/src/navigation";
import { colors } from "@/src/theme";

export default function TabsLayout() {
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
        <NativeTabs.Trigger name="profil">
          <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" />
          <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
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
        tabBarStyle: {
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
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <UserCircle2 color={color} size={size} />
          ),
          tabBarButtonTestID: "tab-profil",
        }}
      />
    </Tabs>
  );
}
