import { ModuleFormScreen } from "@/components/module/module-form-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { patientService } from "@/services/patients";

export default function EditPatientScreen() {
  return <ModuleFormScreen config={moduleConfigs.patients} service={patientService} mode="edit" />;
}
