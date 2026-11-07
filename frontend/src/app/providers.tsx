"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSignalRNotifications } from "@/hooks/useSignalRNotifications";
import { useGlobalQueueWatcher } from "@/hooks/useGlobalQueueWatcher";
import { useGameStore } from "@/store/useGameStore";
import { ToastNotificationCenter } from "@/components/common/ToastNotificationCenter";

function RealtimeSyncListener() {
  useSignalRNotifications();
  useGlobalQueueWatcher();
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSyncListener />
      {children}
      <ToastNotificationCenter />
    </QueryClientProvider>
  );
}

