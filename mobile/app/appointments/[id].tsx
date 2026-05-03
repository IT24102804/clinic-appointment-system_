import { ModuleDetailScreen } from "@/components/module/module-detail-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { appointmentService } from "@/services/appointments";

export default function AppointmentDetailScreen() {
  return <ModuleDetailScreen config={moduleConfigs.appointments} service={appointmentService} />;
}
