'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  type CustomAddonTemplate,
  type TemplateSection,
  type TemplateField,
  type AutomationCondition,
  createEmptyTemplate,
  validateTemplate,
  resluggifyAllFields,
  type ValidationResult,
} from '@/lib/custom-addon-schema';

interface BuilderContextValue {
  template: CustomAddonTemplate;
  setTemplate: (template: CustomAddonTemplate) => void;
  updateTemplate: (partial: Partial<CustomAddonTemplate>) => void;
  updateSection: (sectionId: string, partial: Partial<TemplateSection>) => void;
  addSection: () => void;
  removeSection: (sectionId: string) => void;
  moveSections: (fromIndex: number, toIndex: number) => void;
  updateField: (
    sectionId: string,
    fieldId: string,
    partial: Partial<TemplateField>
  ) => void;
  addField: (sectionId: string, field: TemplateField) => void;
  removeField: (sectionId: string, fieldId: string) => void;
  moveFields: (sectionId: string, fromIndex: number, toIndex: number) => void;
  resluggifyFields: () => void;
  validation: ValidationResult;
  isDirty: boolean;
  /** Tracks which editor last made changes, to avoid circular syncs */
  lastEditor: 'visual' | 'yaml' | null;
  setLastEditor: (editor: 'visual' | 'yaml') => void;
  /** Register a variable-accepting input for toolbox click-to-insert */
  setActiveVariableTarget: (
    target: { insert: (variable: string) => void } | null
  ) => void;
  /** Insert a variable into the currently focused variable input */
  insertVariable: (variable: string) => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({
  initialTemplate,
  children,
}: {
  initialTemplate?: CustomAddonTemplate;
  children: ReactNode;
}) {
  const [template, setTemplateState] = useState<CustomAddonTemplate>(
    initialTemplate ?? createEmptyTemplate()
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lastEditor, setLastEditor] = useState<'visual' | 'yaml' | null>(null);

  const setTemplate = useCallback((newTemplate: CustomAddonTemplate) => {
    setTemplateState(newTemplate);
    setIsDirty(true);
  }, []);

  const updateTemplate = useCallback(
    (partial: Partial<CustomAddonTemplate>) => {
      setTemplateState(prev => ({ ...prev, ...partial }));
      setIsDirty(true);
      setLastEditor('visual');
    },
    []
  );

  const updateSection = useCallback(
    (sectionId: string, partial: Partial<TemplateSection>) => {
      setTemplateState(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, ...partial } : s
        ),
      }));
      setIsDirty(true);
      setLastEditor('visual');
    },
    []
  );

  const addSection = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createEmptySection } = require('@/lib/custom-addon-schema');
    setTemplateState(prev => ({
      ...prev,
      sections: [...prev.sections, createEmptySection()],
    }));
    setIsDirty(true);
    setLastEditor('visual');
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setTemplateState(prev => {
      const removedSection = prev.sections.find(s => s.id === sectionId);
      const removedFieldIds = new Set(
        removedSection?.fields.map(f => f.id) ?? []
      );

      const isOrphanedRef = (c: AutomationCondition) =>
        c.field.startsWith('fields.') &&
        removedFieldIds.has(c.field.slice('fields.'.length));

      const sections = prev.sections
        .filter(s => s.id !== sectionId)
        .map(s => {
          // Clean field-level visibility conditions referencing removed fields
          const updatedFields = s.fields.map(f => {
            if (!f.visibilityConditions?.length) return f;
            const cleaned = f.visibilityConditions.filter(
              c => !isOrphanedRef(c)
            );
            if (cleaned.length === f.visibilityConditions.length) return f;
            return {
              ...f,
              visibilityConditions: cleaned.length > 0 ? cleaned : undefined,
            };
          });

          // Clean section-level visibility conditions referencing removed fields
          let section: TemplateSection = updatedFields.some(
            (f, i) => f !== s.fields[i]
          )
            ? { ...s, fields: updatedFields }
            : s;

          if (section.visibilityConditions?.length) {
            const cleaned = section.visibilityConditions.filter(
              c => !isOrphanedRef(c)
            );
            if (cleaned.length !== section.visibilityConditions.length) {
              section = {
                ...section,
                visibilityConditions: cleaned.length > 0 ? cleaned : undefined,
              };
            }
          }

          return section;
        });

      // Clean automations referencing removed fields
      let automations = prev.automations;
      if (automations?.length && removedFieldIds.size > 0) {
        const updatedAutos = automations.map(auto => {
          let changed = false;
          let updated = auto;

          if (
            auto.trigger.fieldId &&
            removedFieldIds.has(auto.trigger.fieldId)
          ) {
            updated = {
              ...updated,
              trigger: { ...updated.trigger, fieldId: undefined },
            };
            changed = true;
          }

          const cleanedConds = auto.conditions.filter(c => !isOrphanedRef(c));
          if (cleanedConds.length !== auto.conditions.length) {
            updated = { ...updated, conditions: cleanedConds };
            changed = true;
          }

          const cleanedActions = auto.actions.map(a =>
            a.recipientToggleField &&
            removedFieldIds.has(a.recipientToggleField)
              ? { ...a, recipientToggleField: undefined }
              : a
          );
          if (cleanedActions.some((a, i) => a !== auto.actions[i])) {
            updated = { ...updated, actions: cleanedActions };
            changed = true;
          }

          return changed ? updated : auto;
        });
        if (updatedAutos.some((a, i) => a !== automations![i])) {
          automations = updatedAutos;
        }
      }

      return { ...prev, sections, automations };
    });
    setIsDirty(true);
    setLastEditor('visual');
  }, []);

  const moveSections = useCallback((fromIndex: number, toIndex: number) => {
    setTemplateState(prev => {
      const sections = [...prev.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return { ...prev, sections };
    });
    setIsDirty(true);
    setLastEditor('visual');
  }, []);

  const updateField = useCallback(
    (sectionId: string, fieldId: string, partial: Partial<TemplateField>) => {
      setTemplateState(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId
            ? {
                ...s,
                fields: s.fields.map(f =>
                  f.id === fieldId ? { ...f, ...partial } : f
                ),
              }
            : s
        ),
      }));
      setIsDirty(true);
      setLastEditor('visual');
    },
    []
  );

  const addField = useCallback((sectionId: string, field: TemplateField) => {
    setTemplateState(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, fields: [...s.fields, field] } : s
      ),
    }));
    setIsDirty(true);
    setLastEditor('visual');
  }, []);

  const removeField = useCallback((sectionId: string, fieldId: string) => {
    setTemplateState(prev => {
      const fieldPath = `fields.${fieldId}`;

      // Helper: remove conditions that reference the deleted field
      const cleanConditions = (
        conditions: AutomationCondition[]
      ): AutomationCondition[] => {
        const filtered = conditions.filter(c => c.field !== fieldPath);
        return filtered.length !== conditions.length ? filtered : conditions;
      };

      const sections = prev.sections.map(s => {
        let section =
          s.id === sectionId
            ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) }
            : s;

        // Clean field-level visibility conditions
        const updatedFields = section.fields.map(f => {
          if (!f.visibilityConditions?.length) return f;
          const cleaned = cleanConditions(f.visibilityConditions);
          if (cleaned === f.visibilityConditions) return f;
          return {
            ...f,
            visibilityConditions: cleaned.length > 0 ? cleaned : undefined,
          };
        });
        if (updatedFields.some((f, i) => f !== section.fields[i])) {
          section = { ...section, fields: updatedFields };
        }

        // Clean section-level visibility conditions
        if (section.visibilityConditions?.length) {
          const cleaned = cleanConditions(section.visibilityConditions);
          if (cleaned !== section.visibilityConditions) {
            section = {
              ...section,
              visibilityConditions: cleaned.length > 0 ? cleaned : undefined,
            };
          }
        }

        return section;
      });

      // Clean automation conditions, trigger fieldIds, and action recipientToggleField
      let automations = prev.automations;
      if (automations?.length) {
        const updatedAutos = automations.map(auto => {
          let changed = false;
          let updated = auto;

          // Clean trigger fieldId
          if (auto.trigger.fieldId === fieldId) {
            updated = {
              ...updated,
              trigger: { ...updated.trigger, fieldId: undefined },
            };
            changed = true;
          }

          // Clean conditions
          if (auto.conditions.length > 0) {
            const cleaned = cleanConditions(auto.conditions);
            if (cleaned !== auto.conditions) {
              updated = { ...updated, conditions: cleaned };
              changed = true;
            }
          }

          // Clean action recipientToggleField
          const cleanedActions = auto.actions.map(a => {
            if (a.recipientToggleField === fieldId) {
              return { ...a, recipientToggleField: undefined };
            }
            return a;
          });
          if (cleanedActions.some((a, i) => a !== auto.actions[i])) {
            updated = { ...updated, actions: cleanedActions };
            changed = true;
          }

          return changed ? updated : auto;
        });
        if (updatedAutos.some((a, i) => a !== automations![i])) {
          automations = updatedAutos;
        }
      }

      return { ...prev, sections, automations };
    });
    setIsDirty(true);
    setLastEditor('visual');
  }, []);

  const moveFields = useCallback(
    (sectionId: string, fromIndex: number, toIndex: number) => {
      setTemplateState(prev => ({
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id !== sectionId) return s;
          const fields = [...s.fields];
          const [moved] = fields.splice(fromIndex, 1);
          fields.splice(toIndex, 0, moved);
          return { ...s, fields };
        }),
      }));
      setIsDirty(true);
      setLastEditor('visual');
    },
    []
  );

  const resluggifyFields = useCallback(() => {
    setTemplateState(prev => resluggifyAllFields(prev));
  }, []);

  const validation = useMemo(() => validateTemplate(template), [template]);

  // Variable target ref — stored as ref to avoid re-renders
  const activeVariableTargetRef = useRef<{
    insert: (variable: string) => void;
  } | null>(null);

  const setActiveVariableTarget = useCallback(
    (target: { insert: (variable: string) => void } | null) => {
      activeVariableTargetRef.current = target;
    },
    []
  );

  const insertVariable = useCallback((variable: string) => {
    activeVariableTargetRef.current?.insert(variable);
  }, []);

  const value = useMemo(
    () => ({
      template,
      setTemplate,
      updateTemplate,
      updateSection,
      addSection,
      removeSection,
      moveSections,
      updateField,
      addField,
      removeField,
      moveFields,
      resluggifyFields,
      validation,
      isDirty,
      lastEditor,
      setLastEditor,
      setActiveVariableTarget,
      insertVariable,
    }),
    [
      template,
      setTemplate,
      updateTemplate,
      updateSection,
      addSection,
      removeSection,
      moveSections,
      updateField,
      addField,
      removeField,
      moveFields,
      resluggifyFields,
      validation,
      isDirty,
      lastEditor,
      setLastEditor,
      setActiveVariableTarget,
      insertVariable,
    ]
  );

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return ctx;
}
