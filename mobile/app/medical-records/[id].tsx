import { ModuleDetailScreen } from "@/components/module/module-detail-screen";
import { moduleConfigs } from "@/constants/module-configs";
import { medicalRecordService } from "@/services/medical-records";

export default function MedicalRecordDetailScreen() {
  return <ModuleDetailScreen config={moduleConfigs.medicalRecords} service={medicalRecordService} />;
}
