import { ModuleListScreen } from "@/components/module/module-list-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { medicalRecordService } from "@/services/medical-records";

export default function MedicalRecordsScreen() {
  return <ModuleListScreen config={moduleConfigs.medicalRecords} service={medicalRecordService} />;
}
