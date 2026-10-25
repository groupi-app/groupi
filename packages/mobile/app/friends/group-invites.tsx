import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { GroupInviteInbox } from '@/components/groups/group-invitation-panels';

export default function GroupInviteInboxScreen() {
  return (
    <DetailScreenTemplate title='Group invitations'>
      <GroupInviteInbox />
    </DetailScreenTemplate>
  );
}
