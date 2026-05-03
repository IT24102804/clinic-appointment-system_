import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { PrescriptionForm } from "@/components/prescription-form";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { StatePanel } from "@/components/ui/state-panel";
import { getAuthToken } from "@/services/api-client";
import { getPrescription, updatePrescription } from "@/services/prescriptions";
import { PrescriptionPayload } from "@/types/prescription";
import { getRefId } from "@/utils/format-record";

export default function EditPrescriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialValue, setInitialValue] = useState<PrescriptionPayload | undefined>(undefined);
  const hasToken = Boolean(getAuthToken());

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    async function loadPrescription() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        const prescription = await getPrescription(id);
        setInitialValue({
          appointmentId: getRefId(prescription.appointmentId),
          patientId: getRefId(prescription.patientId),
          doctorId: getRefId(prescription.doctorId),
          diagnosis: prescription.diagnosis,
          medicines: prescription.medicines,
          notes: prescription.notes,
          status: prescription.status,
          issuedAt: prescription.issuedAt ? new Date(prescription.issuedAt).toISOString() : "",
        });
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load the prescription.");
      } finally {
        setLoading(false);
      }
    }

    void loadPrescription();
  }, [id]);

  const subtitle = useMemo(() => {
    if (!initialValue) {
      return "Loading current prescription fields...";
    }

    return "Update the prescription details, then save to push changes to the live API.";
  }, [initialValue]);

  if (!hasToken) {
    return (
      <AppScreen style={{ justifyContent: "center" }}>
        <StatePanel
          title="Login required"
          message="Login with a staff account to edit prescriptions."
          actionLabel="Go to login"
          onAction={() => router.push("/auth/login")}
        />
      </AppScreen>
    );
  }

  async function handleSave(payload: PrescriptionPayload) {
    if (!id) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updatePrescription(id, payload);
      router.replace({
        pathname: "/prescriptions/[id]",
        params: { id },
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update the prescription.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppScreen style={{ justifyContent: "center" }}>
        <StatePanel loading message="Loading prescription for editing..." />
      </AppScreen>
    );
  }

  if (!initialValue) {
    return (
      <AppScreen style={{ justifyContent: "center" }}>
        <StatePanel title="Edit screen unavailable" message={error || "The prescription could not be loaded."} variant="error" />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <PageHeader title="Edit prescription" subtitle={subtitle} />
      <PrescriptionForm
        initialValue={initialValue}
        submitLabel="Save changes"
        busy={saving}
        error={error}
        onSubmit={handleSave}
      />
    </AppScreen>
  );
}
