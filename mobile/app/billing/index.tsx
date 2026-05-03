import { ModuleListScreen } from "@/components/module/module-list-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { billingService } from "@/services/billing";

export default function BillingScreen() {
  return <ModuleListScreen config={moduleConfigs.billing} service={billingService} />;
}
