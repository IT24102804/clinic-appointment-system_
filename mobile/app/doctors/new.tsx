import { ModuleFormScreen } from "@/components/module/module-form-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { doctorService } from "@/services/doctors";

export default function NewDoctorScreen() {
  return <ModuleFormScreen config={moduleConfigs.doctors} service={doctorService} mode="create" />;
}
