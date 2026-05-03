import { ModuleListScreen } from "@/components/module/module-list-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { doctorService } from "@/services/doctors";

export default function DoctorsScreen() {
  return <ModuleListScreen config={moduleConfigs.doctors} service={doctorService} />;
}
