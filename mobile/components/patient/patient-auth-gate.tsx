import { Redirect } from "expo-router";
import { PropsWithChildren } from "react";

import { AppScreen } from "@/components/ui/app-screen";
import { StatePanel } from "@/components/ui/state-panel";
import { useAuthSession } from "@/context/auth-context";

export function PatientAuthGate({ children }: PropsWithChildren) {
  const { loading, user } = useAuthSession();

  if (loading) {
    return (
      <AppScreen style={{ justifyContent: "center" }}>
        <StatePanel loading message="Loading patient session..." />
      </AppScreen>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (user.role !== "patient") {
    return <Redirect href="/(tabs)" />;
  }

  return children;
}
