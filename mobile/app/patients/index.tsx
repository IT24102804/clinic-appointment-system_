import { ModuleListScreen } from "@/components/module/module-list-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { patientService } from "@/services/patients";

export default function PatientsScreen() {
  return <ModuleListScreen config={moduleConfigs.patients} service={patientService} />;
}
