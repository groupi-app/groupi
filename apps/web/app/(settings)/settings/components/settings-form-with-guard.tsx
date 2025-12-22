'use client';
import { useFormContext } from 'react-hook-form';
import { SettingsForm } from './settings-form';
import { ConfirmSettings } from './confirm-settings';
import { useNavigationGuard } from '@/hooks/use-navigation-guard';
import { SettingsForm as SettingsFormType } from './settings-form-provider';
import { useRegisterNavigationGuard } from './navigation-guard-context';

export function SettingsFormWithGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { formState } = useFormContext<SettingsFormType>();
  const { shouldFlash, shouldBlockNavigation, triggerFlash } =
    useNavigationGuard(formState.isDirty);

  useRegisterNavigationGuard({
    shouldBlockNavigation,
    triggerFlash,
  });

  return (
    <SettingsForm>
      {children}
      <ConfirmSettings shouldFlash={shouldFlash} />
    </SettingsForm>
  );
}
