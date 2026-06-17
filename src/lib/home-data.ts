export type Room = {
  id: string;
  name: string;
  devices: number;
  active: number;
  temp: number;
  status: "comfortable" | "cooling" | "heating";
};

export type Device = {
  id: string;
  name: string;
  room: string;
  type: "light" | "climate" | "lock" | "camera" | "speaker" | "blinds" | "energy";
  on: boolean;
  value?: number;
  unit?: string;
};

export const rooms: Room[] = [
  { id: "living", name: "Living Room", devices: 8, active: 5, temp: 22, status: "comfortable" },
  { id: "kitchen", name: "Kitchen", devices: 6, active: 3, temp: 23, status: "cooling" },
  { id: "master", name: "Master Bedroom", devices: 7, active: 2, temp: 21, status: "comfortable" },
  { id: "office", name: "Home Office", devices: 5, active: 4, temp: 22, status: "comfortable" },
  { id: "garage", name: "Garage", devices: 4, active: 1, temp: 18, status: "heating" },
  { id: "garden", name: "Garden", devices: 3, active: 2, temp: 17, status: "comfortable" },
];

export const devices: Device[] = [
  { id: "d1", name: "Ambient Ceiling", room: "Living Room", type: "light", on: true, value: 72, unit: "%" },
  { id: "d2", name: "Climate Control", room: "Living Room", type: "climate", on: true, value: 22, unit: "°C" },
  { id: "d3", name: "Front Door Lock", room: "Living Room", type: "lock", on: true },
  { id: "d4", name: "Smart Blinds", room: "Living Room", type: "blinds", on: false, value: 40, unit: "%" },
  { id: "d5", name: "Kitchen Spotlights", room: "Kitchen", type: "light", on: true, value: 90, unit: "%" },
  { id: "d6", name: "Refrigerator", room: "Kitchen", type: "energy", on: true, value: 4, unit: "°C" },
  { id: "d7", name: "Bedroom Lamp", room: "Master Bedroom", type: "light", on: false, value: 30, unit: "%" },
  { id: "d8", name: "Bedroom Climate", room: "Master Bedroom", type: "climate", on: true, value: 21, unit: "°C" },
  { id: "d9", name: "Desk Setup", room: "Home Office", type: "speaker", on: true, value: 45, unit: "%" },
  { id: "d10", name: "Security Camera", room: "Garage", type: "camera", on: true },
  { id: "d11", name: "Garage Door", room: "Garage", type: "lock", on: false },
  { id: "d12", name: "Garden Lights", room: "Garden", type: "light", on: true, value: 60, unit: "%" },
];

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  level: "info" | "success" | "warning" | "alert";
  read: boolean;
};

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "Front door unlocked",
    body: "Master Suite key fob detected at the front entrance.",
    time: "2 min ago",
    level: "success",
    read: false,
  },
  {
    id: "n2",
    title: "Energy usage spike",
    body: "Kitchen drew 18% more power than your weekly average.",
    time: "26 min ago",
    level: "warning",
    read: false,
  },
  {
    id: "n3",
    title: "Motion detected",
    body: "Garage camera recorded movement while away mode was active.",
    time: "1 hr ago",
    level: "alert",
    read: false,
  },
  {
    id: "n4",
    title: "Automation completed",
    body: "Good Morning scene ran across 12 devices successfully.",
    time: "3 hrs ago",
    level: "info",
    read: true,
  },
  {
    id: "n5",
    title: "Firmware updated",
    body: "Nosky Hub updated to HomeOS v4.2 with no downtime.",
    time: "Yesterday",
    level: "success",
    read: true,
  },
];

export const energyByDay = [
  { day: "Mon", usage: 28, solar: 18 },
  { day: "Tue", usage: 32, solar: 22 },
  { day: "Wed", usage: 26, solar: 25 },
  { day: "Thu", usage: 35, solar: 20 },
  { day: "Fri", usage: 30, solar: 27 },
  { day: "Sat", usage: 22, solar: 30 },
  { day: "Sun", usage: 19, solar: 31 },
];

export const usageByHour = [
  { hour: "00", load: 12 },
  { hour: "04", load: 8 },
  { hour: "08", load: 34 },
  { hour: "12", load: 41 },
  { hour: "16", load: 38 },
  { hour: "20", load: 52 },
  { hour: "23", load: 24 },
];
