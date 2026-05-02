import { Redirect } from "expo-router";

export default function ModalRedirectScreen() {
  return <Redirect href={'/(patient)' as any} />;
}
