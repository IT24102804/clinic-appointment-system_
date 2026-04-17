import { ModulePlaceholderScreen } from "@/components/ui/module-placeholder-screen";

export default function AppointmentsPlaceholderScreen() {
  return (
    <ModulePlaceholderScreen
      eyebrow="Visit workflow"
      title="Appointments"
      owner="Member 3"
      description="This area is reserved for booking, rescheduling, cancellation, and visit coordination so staff can manage the day from one place."
      plannedScreens={[
        "Appointment list",
        "Appointment details",
        "Create appointment",
        "Edit / reschedule appointment",
      ]}
    />
  );
}
