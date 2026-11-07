"use client";

import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { useGameStore } from "@/store/useGameStore";

export function useSignalRNotifications() {
  const addFleetAlert = useGameStore((s) => s.addFleetAlert);
  const completeActiveBuildingUpgrade = useGameStore((s) => s.completeActiveBuildingUpgrade);

  useEffect(() => {
    const hubUrl =
      process.env.NEXT_PUBLIC_SIGNALR_HUB_URL ?? "http://localhost:5000/hubs/game";

    let isCancelled = false;
    let isStarted = false;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    connection.on("BuildingCompletedEvent", (payload: unknown) => {
      completeActiveBuildingUpgrade();
      console.info("SignalR BuildingCompletedEvent received:", payload);
    });

    connection.on("ResearchCompletedEvent", (payload: unknown) => {
      completeActiveBuildingUpgrade();
      console.info("SignalR ResearchCompletedEvent received:", payload);
    });

    connection.on("QueueCompleted", (payload: unknown) => {
      completeActiveBuildingUpgrade();
      console.info("SignalR QueueCompleted received:", payload);
    });

    connection.on("ShipyardUnitCompletedEvent", (payload: unknown) => {
      completeActiveBuildingUpgrade();
      console.info("SignalR ShipyardUnitCompletedEvent received:", payload);
    });

    connection.on("IncomingFleetAlert", (alert: { id: string; originCoords: string; targetCoords: string; missionType: string; arrivalUtc: string; shipCount: number; isHostile: boolean }) => {
      addFleetAlert(alert);
    });

    connection
      .start()
      .then(() => {
        isStarted = true;
        if (isCancelled) {
          connection.stop().catch(() => {});
        }
      })
      .catch(() => {
        // Gracefully operate in offline/standalone UI mode when hub is unreachable
      });

    return () => {
      isCancelled = true;
      if (isStarted) {
        connection.stop().catch(() => {});
      }
    };
  }, [addFleetAlert, completeActiveBuildingUpgrade]);
}

