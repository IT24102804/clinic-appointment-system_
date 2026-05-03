import { ModuleFormScreen } from "@/components/module/module-form-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { doctorService } from "@/services/doctors";

export default function EditDoctorScreen() {
  return <ModuleFormScreen config={moduleConfigs.doctors} service={doctorService} mode="edit" />;
}
