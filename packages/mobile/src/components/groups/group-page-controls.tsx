import { View } from 'react-native';
import { Button } from '@/components/ui/button';

export function GroupPageControls({
  page,
  cursor,
  onPage,
  label,
}: {
  page: { isDone: boolean; continueCursor: string } | undefined;
  cursor: string | null;
  onPage: (cursor: string | null) => void;
  label: string;
}) {
  return (
    <View className='gap-2'>
      {cursor ? (
        <Button
          variant='ghost'
          accessibilityLabel={`First page of ${label}`}
          onPress={() => onPage(null)}
        >
          First page
        </Button>
      ) : null}
      {page && !page.isDone ? (
        <Button
          variant='outline'
          accessibilityLabel={`Next ${label}`}
          onPress={() => onPage(page.continueCursor)}
        >
          Next page
        </Button>
      ) : null}
    </View>
  );
}
