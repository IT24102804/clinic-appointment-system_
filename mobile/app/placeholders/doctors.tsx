import { ModulePlaceholderScreen } from "@/components/ui/module-placeholder-screen";

export default function DoctorsPlaceholderScreen() {
  return (
    <ModulePlaceholderScreen
      title="Doctor Management"
      owner="Member 2"
      description="This space is reserved for doctor CRUD, specialization fields, and availability management."
      plannedScreens={[
        "Doctor list",
        "Doctor details",
        "Create doctor",
        "Edit doctor",
      ]}
    />
  );
}
