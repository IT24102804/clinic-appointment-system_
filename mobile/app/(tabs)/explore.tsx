import { Redirect } from "expo-router";

export default function LegacyExploreRedirectScreen() {
  return <Redirect href={'/(patient)' as any} />;
}
