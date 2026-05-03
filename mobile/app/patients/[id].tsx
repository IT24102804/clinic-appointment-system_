import { ModuleDetailScreen } from "@/components/module/module-detail-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { patientService } from "@/services/patients";

export default function PatientDetailScreen() {
  return <ModuleDetailScreen config={moduleConfigs.patients} service={patientService} />;
}
