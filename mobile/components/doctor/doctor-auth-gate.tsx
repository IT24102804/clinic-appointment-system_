import { Redirect } from "expo-router";
import { PropsWithChildren } from "react";

import { useAuthSession } from "@/context/auth-context";

export function DoctorAuthGate({ children }: PropsWithChildren) {
  const { loading, user } = useAuthSession();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (user.role !== "doctor") {
    return <Redirect href={user.role === "patient" ? "/patient/home" : "/(tabs)"} />;
  }

  return children;
}
