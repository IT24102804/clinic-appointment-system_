import { ModuleDetailScreen } from "@/components/module/module-detail-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { billingService } from "@/services/billing";

export default function BillingDetailScreen() {
  return <ModuleDetailScreen config={moduleConfigs.billing} service={billingService} />;
}
