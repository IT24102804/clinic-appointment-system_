import { ModuleDetailScreen } from "@/components/module/module-detail-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { doctorService } from "@/services/doctors";

export default function DoctorDetailScreen() {
  return <ModuleDetailScreen config={moduleConfigs.doctors} service={doctorService} />;
}
