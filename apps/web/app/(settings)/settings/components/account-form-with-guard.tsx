'use client';
import { useFormContext } from 'react-hook-form';
import { AccountForm } from './account-form';
import { ConfirmAccountSettings } from './confirm-account-settings';
import { useNavigationGuard } from '@/hooks/use-navigation-guard';
import { AccountForm as AccountFormType } from './account-form-provider';
import { useRegisterNavigationGuard } from './navigation-guard-context';

export function AccountFormWithGuard({ children }: { children: React.ReactNode }) {
  const { formState } = useFormContext<AccountFormType>();
  const { shouldFlash, shouldBlockNavigation, triggerFlash } = useNavigationGuard(
    formState.isDirty
  );

  useRegisterNavigationGuard({
    shouldBlockNavigation,
    triggerFlash,
  });

  return (
    <AccountForm>
      {children}
      <ConfirmAccountSettings shouldFlash={shouldFlash} />
    </AccountForm>
  );
}

