import { ModulePlaceholderScreen } from "@/components/ui/module-placeholder-screen";

export default function PatientsPlaceholderScreen() {
  return (
    <ModulePlaceholderScreen
      title="Patient Management"
      owner="Member 1"
      description="This space is reserved for patient CRUD and profile management screens."
      plannedScreens={[
        "Patient list",
        "Patient details",
        "Create patient",
        "Edit patient",
      ]}
    />
  );
}
