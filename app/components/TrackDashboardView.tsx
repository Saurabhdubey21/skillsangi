"use client";

import { useEffect } from "react";
import { track } from "@/lib/admin/track-client";

// Invisible. Records one "dashboard_view" event per browser tab per day,
// so refreshing the page does not inflate the admin numbers.
export default function TrackDashboardView() {
  useEffect(() => {
    try {
      const key = "ss_dashboard_view";
      const today = new Date().toDateString();
      if (sessionStorage.getItem(key) === today) return;
      sessionStorage.setItem(key, today);
    } catch {
      // storage can be blocked; fall through and track anyway
    }
    track("dashboard_view");
  }, []);

  return null;
}