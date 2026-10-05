'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { createGroupFormHooks } from '@groupi/shared/hooks';
export const {
  useForm,
  useForms,
  useFormHistory,
  useFormResults,
  useCreateForm,
  useConfigureForm,
  useSubmitFormResponse,
  useRemoveFormResponse,
  useRemoveFormResult,
  useDeleteForm,
  useFormPolicy,
  useConfigureFormPolicy,
} = createGroupFormHooks(api, { useQuery, useMutation });
