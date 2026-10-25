import { Redirect, useLocalSearchParams } from 'expo-router';
export default function LegacyManageAddons() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return <Redirect href={`/event/${eventId}/settings/addons`} />;
}
