// Legacy (tabs) group — kept only so old links keep working.
// The real patient experience lives in app/(patient).
import { Redirect } from 'expo-router';

export default function LegacyTabsRedirect() {
  return <Redirect href={'/(patient)' as any} />;
}