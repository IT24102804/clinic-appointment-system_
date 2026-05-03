import { ModuleFormScreen } from "@/components/module/module-form-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { billingService } from "@/services/billing";

export default function EditBillScreen() {
  return <ModuleFormScreen config={moduleConfigs.billing} service={billingService} mode="edit" />;
}
