import { ModulePlaceholderScreen } from "@/components/ui/module-placeholder-screen";

export default function MedicalRecordsPlaceholderScreen() {
  return (
    <ModulePlaceholderScreen
      title="Medical Records"
      owner="Member 6"
      description="This space is reserved for visit history, diagnosis notes, and treatment record screens."
      plannedScreens={[
        "Medical record list",
        "Medical record details",
        "Create medical record",
        "Edit medical record",
      ]}
    />
  );
}
