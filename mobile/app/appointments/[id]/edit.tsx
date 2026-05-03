import { ModuleFormScreen } from "@/components/module/module-form-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { appointmentService } from "@/services/appointments";

export default function EditAppointmentScreen() {
  return <ModuleFormScreen config={moduleConfigs.appointments} service={appointmentService} mode="edit" />;
}
