'use client';

import {
  createContext,
  useEffect,
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
  createEmptySection,
  validateTemplate,
  templateToYaml,
  yamlToTemplate,
  resluggifyAllFields,
  type ValidationResult,
} from '../model/custom-addon-schema';

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
  markSaved: (template: CustomAddonTemplate, yaml: string) => void;
  revert: () => void;
  yamlValue: string;
  yamlErrors: string[];
  yamlPending: boolean;
  yamlInvalid: boolean;
  editYaml: (value: string) => void;
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
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
    () => initialTemplate ?? createEmptyTemplate()
  );
  const [saved, setSaved] = useState(() => {
    const initial = initialTemplate ?? template;
    return { template: JSON.stringify(initial), yaml: templateToYaml(initial) };
  });
  const [activeSection, setActiveSectionId] = useState<string | null>(
    template.sections[0]?.id ?? null
  );
  const activeSectionId =
    activeSection === null ||
    template.sections.some(section => section.id === activeSection)
      ? activeSection
      : (template.sections[0]?.id ?? null);
  const [yamlDraft, setYamlDraft] = useState<{
    text: string | null;
    pending: boolean;
    invalid: boolean;
    errors: string[];
  }>({ text: null, pending: false, invalid: false, errors: [] });
  const [lastEditor, setLastEditor] = useState<'visual' | 'yaml' | null>(null);

  const setTemplate = useCallback((newTemplate: CustomAddonTemplate) => {
    setTemplateState(newTemplate);
  }, []);

  const updateTemplate = useCallback(
    (partial: Partial<CustomAddonTemplate>) => {
      setTemplateState(prev => ({ ...prev, ...partial }));
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
      setLastEditor('visual');
    },
    []
  );

  const addSection = useCallback(() => {
    const section = createEmptySection();
    setActiveSectionId(section.id);
    setTemplateState(prev => ({
      ...prev,
      sections: [...prev.sections, section],
    }));
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
    setLastEditor('visual');
  }, []);

  const moveSections = useCallback((fromIndex: number, toIndex: number) => {
    setTemplateState(prev => {
      const sections = [...prev.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return { ...prev, sections };
    });
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
      setLastEditor('visual');
    },
    []
  );

  const resluggifyFields = useCallback(() => {
    setTemplateState(prev => resluggifyAllFields(prev));
    setLastEditor('visual');
  }, []);

  // The raw draft belongs to the provider, so mode changes cannot drop invalid or pending YAML.
  const yamlValue =
    lastEditor === 'visual' && !yamlDraft.pending && !yamlDraft.invalid
      ? templateToYaml(template)
      : (yamlDraft.text ?? templateToYaml(template));
  const editYaml = useCallback((text: string) => {
    setLastEditor('yaml');
    setYamlDraft({ text, pending: true, invalid: false, errors: [] });
  }, []);
  useEffect(() => {
    if (!yamlDraft.pending || yamlDraft.text === null) return;
    const text = yamlDraft.text;
    const timer = setTimeout(() => {
      try {
        const parsed = yamlToTemplate(text);
        if (parsed.error || !parsed.template)
          throw new Error(parsed.error ?? 'Invalid YAML');
        const next = parsed.template;
        // Do not put malformed editor documents into the visual renderer.
        if (
          typeof next.name !== 'string' ||
          typeof next.description !== 'string' ||
          typeof next.iconName !== 'string' ||
          !Array.isArray(next.sections) ||
          next.sections.some(
            section =>
              typeof section.id !== 'string' ||
              typeof section.title !== 'string' ||
              !Array.isArray(section.fields)
          )
        )
          throw new Error(
            'Use an add-on with a name, description, iconName and sections containing fields.'
          );
        const result = validateTemplate(next);
        setTemplateState(next);
        setYamlDraft({
          text,
          pending: false,
          invalid: false,
          errors: result.errorMessages,
        });
      } catch (error) {
        setYamlDraft({
          text,
          pending: false,
          invalid: true,
          errors: [
            error instanceof Error ? error.message : 'Invalid add-on YAML',
          ],
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [yamlDraft.pending, yamlDraft.text]);
  const isDirty =
    JSON.stringify(template) !== saved.template ||
    yamlValue !== saved.yaml ||
    yamlDraft.pending ||
    yamlDraft.invalid;
  const markSaved = useCallback(
    (snapshot: CustomAddonTemplate, yaml: string) => {
      setSaved({ template: JSON.stringify(snapshot), yaml });
    },
    []
  );

  const revert = useCallback(() => {
    setTemplateState(JSON.parse(saved.template) as CustomAddonTemplate);
    setYamlDraft({
      text: saved.yaml,
      pending: false,
      invalid: false,
      errors: [],
    });
    setLastEditor('yaml');
  }, [saved]);

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
      markSaved,
      revert,
      yamlValue,
      yamlErrors: yamlDraft.errors,
      yamlPending: yamlDraft.pending,
      yamlInvalid: yamlDraft.invalid,
      editYaml,
      activeSectionId,
      setActiveSectionId,
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
      markSaved,
      revert,
      yamlValue,
      yamlDraft,
      editYaml,
      activeSectionId,
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
