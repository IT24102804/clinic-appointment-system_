import { ModuleFormScreen } from "@/components/module/module-form-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { medicalRecordService } from "@/services/medical-records";

export default function EditMedicalRecordScreen() {
  return <ModuleFormScreen config={moduleConfigs.medicalRecords} service={medicalRecordService} mode="edit" />;
}
