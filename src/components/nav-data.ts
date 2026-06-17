import {
  LayoutDashboard,
  DoorOpen,
  Cpu,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Rooms", to: "/rooms", icon: DoorOpen },
  { title: "Devices", to: "/devices", icon: Cpu },
  { title: "Analytics", to: "/analytics", icon: BarChart3 },
  { title: "Notifications", to: "/notifications", icon: Bell, badge: 3 },
  { title: "Settings", to: "/settings", icon: Settings },
];
