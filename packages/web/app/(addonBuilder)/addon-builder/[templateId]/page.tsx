'use client';

import { use } from 'react';
import { EditTemplate } from '@/features/addons/authoring';

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  return <EditTemplate templateId={templateId} />;
}
