import { ModuleListScreen } from "@/components/module/module-list-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { appointmentService } from "@/services/appointments";

export default function AppointmentsScreen() {
  return <ModuleListScreen config={moduleConfigs.appointments} service={appointmentService} />;
}
