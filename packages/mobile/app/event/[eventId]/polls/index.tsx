import type { ErrorBoundaryProps } from 'expo-router';
import {
  EventToolError,
  EventToolScreen,
} from '@/components/content/event-tool-screen';
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <EventToolError {...props} kind='polls' />;
}
export default function Screen() {
  return <EventToolScreen kind='polls' mode='index' />;
}
