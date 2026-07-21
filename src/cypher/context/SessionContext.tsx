import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouterState, useRouter } from "@tanstack/react-router";
import { supabase, type SmartWattDevice, supabaseConfigured } from "@/lib/supabase";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated" | "expired";

export interface SimulationState {
  online: boolean;
  actualState: boolean;
  desiredState: boolean;
  delayMs: number;
  triggerTimeout: boolean;
  triggerNetworkError: boolean;
  triggerElevenLabsFailure: boolean;
}

export interface SessionContextType {
  authStatus: AuthStatus;
  session: any;
  user: any;
  userProfile: any;
  isAuthenticated: boolean;
  networkOnline: boolean;
  supabaseReachable: boolean;
  realtimeConnected: boolean;
  deviceId: string | null;
  deviceRecord: SmartWattDevice | null;
  deviceOnline: boolean;
  desiredState: boolean | null;
  actualState: boolean | null;
  lastSeen: string | null;
  lastUpdated: string | null;
  microphonePermission: "granted" | "denied" | "prompt" | "unknown";
  speechRecognitionAvailable: boolean;
  speechRecognitionActive: boolean;
  setSpeechRecognitionActive: (active: boolean) => void;
  elevenLabsAvailable: boolean;
  pwaInstalled: boolean;
  currentRoute: string;
  currentPage: string;
  pendingCommand: { desired: boolean; timestamp: number } | null;
  setPendingCommand: (cmd: { desired: boolean; timestamp: number } | null) => void;
  lastError: string | null;
  setLastError: (err: string | null) => void;

  // Simulation controls
  simulationMode: boolean;
  setSimulationMode: (mode: boolean) => void;
  simulationState: SimulationState;
  setSimulationState: (
    state: Partial<SimulationState> | ((prev: SimulationState) => SimulationState),
  ) => void;

  // Refresh trigger
  refreshDevice: () => Promise<void>;
  // Manual trigger command helper
  sendDeviceCommand: (nextState: boolean) => Promise<{ success: boolean; error?: string }>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const defaultSimulationState: SimulationState = {
  online: true,
  actualState: false,
  desiredState: false,
  delayMs: 2000,
  triggerTimeout: false,
  triggerNetworkError: false,
  triggerElevenLabsFailure: false,
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const routerState = useRouterState();
  const router = useRouter();

  // Route & Page derived from routerState
  const currentRoute = routerState.location.pathname;
  const currentPage = routerState.location.pathname === "/" ? "Dashboard" : "Settings";

  // State elements
  const [authStatus, setAuthStatus] = useState<AuthStatus>("initializing");
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [networkOnline, setNetworkOnline] = useState<boolean>(true);
  const [supabaseReachable, setSupabaseReachable] = useState<boolean>(true);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceRecord, setDeviceRecord] = useState<SmartWattDevice | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState<boolean>(false);
  const [speechRecognitionActive, setSpeechRecognitionActive] = useState<boolean>(false);
  const [elevenLabsAvailable, setElevenLabsAvailable] = useState<boolean>(true);
  const [pwaInstalled, setPwaInstalled] = useState<boolean>(false);
  const [pendingCommand, setPendingCommand] = useState<{
    desired: boolean;
    timestamp: number;
  } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Simulation Mode state
  const [simulationMode, setSimulationModeState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sw.simulation_mode") === "true";
    }
    return false;
  });
  const [simulationState, setSimulationStateInternal] =
    useState<SimulationState>(defaultSimulationState);

  const setSimulationMode = (mode: boolean) => {
    setSimulationModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("sw.simulation_mode", mode ? "true" : "false");
    }
  };

  const setSimulationState = (
    stateUpdate: Partial<SimulationState> | ((prev: SimulationState) => SimulationState),
  ) => {
    setSimulationStateInternal((prev) => {
      const next =
        typeof stateUpdate === "function" ? stateUpdate(prev) : { ...prev, ...stateUpdate };
      return next;
    });
  };

  const isAuthenticated = authStatus === "authenticated";

  // Maintain active references to handle state changes cleanly
  const simulationModeRef = useRef(simulationMode);
  const simulationStateRef = useRef(simulationState);
  useEffect(() => {
    simulationModeRef.current = simulationMode;
  }, [simulationMode]);
  useEffect(() => {
    simulationStateRef.current = simulationState;
  }, [simulationState]);

  // Derived properties from database or simulation state
  const deviceOnline = simulationMode ? simulationState.online : (deviceRecord?.online ?? false);
  const desiredState = simulationMode
    ? simulationState.desiredState
    : deviceRecord
      ? deviceRecord.desired_state
      : null;
  const actualState = simulationMode
    ? simulationState.actualState
    : deviceRecord
      ? deviceRecord.actual_state
      : null;
  const lastSeen = deviceRecord?.updated_at || null;
  const lastUpdated = deviceRecord?.updated_at || null;

  // 1. Fetch current paired device or SW-0001 fallback
  const fetchDevice = useCallback(async (userId: string | null) => {
    if (!supabaseConfigured || !userId) return;
    try {
      // Resolve device bound to authenticated user
      const { data, error } = await supabase
        .from("smart_watt_devices")
        .select("*")
        .eq("device_auth_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDeviceRecord(data as SmartWattDevice);
        setDeviceId(data.device_code);
      } else {
        // Fallback to SW-0001 for test/dev
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("smart_watt_devices")
          .select("*")
          .eq("device_code", "SW-0001")
          .maybeSingle();

        if (fallbackError) throw fallbackError;

        if (fallbackData) {
          setDeviceRecord(fallbackData as SmartWattDevice);
          setDeviceId("SW-0001");
        }
      }
      setSupabaseReachable(true);
    } catch (e: any) {
      console.error("[SessionContext] Error fetching device status:", e);
      setSupabaseReachable(false);
      setLastError(e.message || "Failed to reach Supabase server");
    }
  }, []);

  const refreshDevice = useCallback(async () => {
    if (simulationModeRef.current) {
      // In simulation mode, refresh is a noop or resets simulation latency
      return;
    }
    const currentUserId = user?.id || null;
    await fetchDevice(currentUserId);
  }, [fetchDevice, user]);

  // Command delivery engine (determines simulation or physical mode)
  const sendDeviceCommand = useCallback(
    async (nextState: boolean): Promise<{ success: boolean; error?: string }> => {
      if (simulationModeRef.current) {
        if (simulationStateRef.current.triggerNetworkError) {
          setLastError("Network simulation error");
          return { success: false, error: "Simulated network failure." };
        }

        setSimulationState({ desiredState: nextState });
        setPendingCommand({ desired: nextState, timestamp: Date.now() });

        // Simulate network delay and actual physical device toggling
        setTimeout(() => {
          if (simulationStateRef.current.triggerTimeout) {
            // Timeout triggers, physical state never confirms
            setPendingCommand(null);
            setLastError("Command confirmation timeout (simulated)");
          } else {
            setSimulationState({ actualState: nextState });
            setPendingCommand(null);
          }
        }, simulationStateRef.current.delayMs);

        return { success: true };
      }

      // Physical mode
      if (!supabaseConfigured || !deviceId) {
        return { success: false, error: "Supabase not configured or no active device matched." };
      }

      try {
        const { error } = await supabase
          .from("smart_watt_devices")
          .update({ desired_state: nextState })
          .eq("device_code", deviceId);

        if (error) {
          throw error;
        }

        setPendingCommand({ desired: nextState, timestamp: Date.now() });
        return { success: true };
      } catch (e: any) {
        setLastError(e.message || "Failed to deliver hardware command");
        return { success: false, error: e.message || "Failed to deliver hardware command" };
      }
    },
    [deviceId],
  );

  // Realtime subscription setup
  useEffect(() => {
    if (simulationMode || !isAuthenticated || !supabaseConfigured || !deviceId) {
      setRealtimeConnected(false);
      return;
    }

    let isSubscribed = true;
    const channel = supabase
      .channel(`session_context_realtime_${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "smart_watt_devices",
          filter: `device_code=eq.${deviceId}`,
        },
        (payload) => {
          if (!isSubscribed) return;
          const updatedDevice = payload.new as SmartWattDevice | undefined;
          if (updatedDevice) {
            setDeviceRecord(updatedDevice);
            // Clear pending command if the physical device actual_state matches
            setPendingCommand((current) => {
              if (current && updatedDevice.actual_state === current.desired) {
                return null;
              }
              return current;
            });
          }
        },
      )
      .subscribe((status) => {
        if (isSubscribed) {
          setRealtimeConnected(status === "SUBSCRIBED");
        }
      });

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [simulationMode, isAuthenticated, deviceId]);

  // Monitor pending commands to handle physical timeout fallback
  useEffect(() => {
    if (!pendingCommand) return;
    const timeout = setTimeout(() => {
      setPendingCommand((current) => {
        if (current) {
          setLastError("Physical device handshake timed out.");
          return null;
        }
        return null;
      });
    }, 12000);

    return () => clearTimeout(timeout);
  }, [pendingCommand]);

  // Supabase Auth listener
  useEffect(() => {
    let active = true;

    // Fetch initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthStatus("unauthenticated");
        setUser(null);
        setSession(null);
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setUserProfile(data.session.user?.user_metadata || {});
        setAuthStatus("authenticated");
        // Trigger initial device lookup
        fetchDevice(data.session.user.id);
      } else {
        setAuthStatus("unauthenticated");
      }
    });

    // Single direct listener for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;

      if (s) {
        setSession(s);
        setUser(s.user);
        setUserProfile(s.user?.user_metadata || {});
        setAuthStatus("authenticated");
        fetchDevice(s.user.id);
      } else {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setDeviceRecord(null);
        setDeviceId(null);
        setPendingCommand(null);
        if (event === "SIGNED_OUT") {
          setAuthStatus("unauthenticated");
        } else {
          setAuthStatus("expired");
        }
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchDevice]);

  // Monitor browser network status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setNetworkOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitor microphone permissions and availability
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check capability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechRecognitionAvailable(!!SpeechRecognition);

    if (!("permissions" in navigator)) return;

    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: "microphone" as any });
        setMicrophonePermission(result.state as any);
        result.onchange = () => {
          setMicrophonePermission(result.state as any);
        };
      } catch {
        setMicrophonePermission("unknown");
      }
    };

    checkPermission();
  }, []);

  // Monitor PWA installation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAppInstalled = () => setPwaInstalled(true);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Safari / iOS fallback check or general display-mode check
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setPwaInstalled(true);
    }

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const value: SessionContextType = {
    authStatus,
    session,
    user,
    userProfile,
    isAuthenticated,
    networkOnline,
    supabaseReachable,
    realtimeConnected,
    deviceId,
    deviceRecord,
    deviceOnline,
    desiredState,
    actualState,
    lastSeen,
    lastUpdated,
    microphonePermission,
    speechRecognitionAvailable,
    speechRecognitionActive,
    setSpeechRecognitionActive,
    elevenLabsAvailable,
    pwaInstalled,
    currentRoute,
    currentPage,
    pendingCommand,
    setPendingCommand,
    lastError,
    setLastError,

    // Simulation Mode
    simulationMode,
    setSimulationMode,
    simulationState,
    setSimulationState,

    // Methods
    refreshDevice,
    sendDeviceCommand,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};
