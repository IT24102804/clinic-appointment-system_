import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { PrescriptionForm } from "@/components/prescription-form";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { StatePanel } from "@/components/ui/state-panel";
import { getAuthToken } from "@/services/api-client";
import { createPrescription } from "@/services/prescriptions";
import { PrescriptionPayload } from "@/types/prescription";

export default function NewPrescriptionScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!getAuthToken()) {
    return (
      <AppScreen style={{ justifyContent: "center" }}>
        <StatePanel
          title="Login required"
          message="Login with a staff account to create prescriptions."
          actionLabel="Go to login"
          onAction={() => router.push("/auth/login")}
        />
      </AppScreen>
    );
  }

  async function handleCreate(payload: PrescriptionPayload) {
    try {
      setBusy(true);
      setError(null);
      const prescription = await createPrescription(payload);
      Alert.alert("Prescription created", "The record was saved successfully.");
      router.replace({
        pathname: "/prescriptions/[id]",
        params: { id: prescription._id },
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create prescription.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen scroll>
      <PageHeader
        title="Create prescription"
        subtitle="Enter the appointment, patient, and doctor references first, then record the medicines and notes."
      />
      <PrescriptionForm submitLabel="Save prescription" busy={busy} error={error} onSubmit={handleCreate} />
    </AppScreen>
  );
}
