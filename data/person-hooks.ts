import { fetchPersonData } from '@/lib/actions/person';
import { getPersonQuery } from '@/lib/query-definitions';
import { ActionResponse, PersonData } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function usePersonDataQuery(
  userId: string,
  select: (data: ActionResponse<PersonData>) => any
) {
  const queryDefinition = getPersonQuery(userId);
  return useQuery({
    queryFn: async () => fetchPersonData(userId),
    queryKey: [queryDefinition.queryKey],
    select,
  });
}

export function usePersonMemberships(userId: string) {
  return usePersonDataQuery(userId, (data: ActionResponse<PersonData>) => {
    if (data.error) {
      return {
        error: data.error,
      };
    }
    if (data.success) {
      return {
        memberships: data.success.memberships,
      };
    }
  });
}
