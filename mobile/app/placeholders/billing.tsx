import { ModulePlaceholderScreen } from "@/components/ui/module-placeholder-screen";

export default function BillingPlaceholderScreen() {
  return (
    <ModulePlaceholderScreen
      title="Billing Management"
      owner="Member 5"
      description="This space is reserved for billing CRUD, payment status handling, and invoice screens."
      plannedScreens={[
        "Bill list",
        "Bill details",
        "Create bill",
        "Edit bill",
      ]}
    />
  );
}
