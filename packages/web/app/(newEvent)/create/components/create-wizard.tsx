'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormProvider, useFormContext } from './form-context';
import NewEventInfo from './new-event-info';
import { DateTypeSelection } from './date-type-selection';
import { NewEventSingleDate } from './new-event-single-date';
import { NewEventMultiDate } from './new-event-multi-date';
import { NewEventPermissions } from './new-event-permissions';
import { NewEventAddons } from './new-event-addons';

type Step =
  | 'info'
  | 'date-type'
  | 'single-date'
  | 'multi-date'
  | 'permissions'
  | 'add-ons';

const stepOrder: Record<Step, number> = {
  info: 0,
  'date-type': 1,
  'single-date': 2,
  'multi-date': 2,
  permissions: 3,
  'add-ons': 4,
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

const transition = {
  x: { type: 'spring' as const, stiffness: 600, damping: 45 },
  opacity: { duration: 0.08 },
};

function WizardContent() {
  const { formState } = useFormContext();
  const [stepState, setStepState] = useState<Step>('info');
  const [direction, setDirection] = useState(1);
  const [isInitialMount, setIsInitialMount] = useState(true);

  if (!formState.title && stepState !== 'info') {
    setStepState('info');
    setIsInitialMount(true);
  }

  const step: Step = !formState.title ? 'info' : stepState;

  const goToStep = (newStep: Step) => {
    const currentOrder = stepOrder[step];
    const newOrder = stepOrder[newStep];
    setDirection(newOrder > currentOrder ? 1 : -1);
    setStepState(newStep);
    if (isInitialMount) {
      setIsInitialMount(false);
    }
  };

  const handleInfoNext = () => {
    goToStep('date-type');
  };

  const handleDateTypeSelect = (type: 'single' | 'multi') => {
    goToStep(type === 'single' ? 'single-date' : 'multi-date');
  };

  const handleDateBack = () => {
    goToStep('date-type');
  };

  const handleDateTypeBack = () => {
    goToStep('info');
  };

  const handleDateNext = () => {
    goToStep('permissions');
  };

  const handlePermissionsBack = () => {
    goToStep(formState.dateType === 'multi' ? 'multi-date' : 'single-date');
  };

  const handlePermissionsNext = () => {
    goToStep('add-ons');
  };

  const handleAddonsBack = () => {
    goToStep('permissions');
  };

  return (
    <div className='relative min-h-[400px]'>
      <AnimatePresence mode='wait' custom={direction}>
        {step === 'info' && (
          <motion.div
            key='info'
            custom={direction}
            variants={slideVariants}
            initial={isInitialMount ? false : 'enter'}
            animate='center'
            exit='exit'
            transition={transition}
            className='w-full'
          >
            <NewEventInfo onNext={handleInfoNext} />
          </motion.div>
        )}
        {step === 'date-type' && (
          <motion.div
            key='date-type'
            custom={direction}
            variants={slideVariants}
            initial={isInitialMount ? false : 'enter'}
            animate='center'
            exit='exit'
            transition={transition}
            className='w-full'
          >
            <DateTypeSelection
              onSelectSingle={() => handleDateTypeSelect('single')}
              onSelectMulti={() => handleDateTypeSelect('multi')}
              onBack={handleDateTypeBack}
            />
          </motion.div>
        )}
        {step === 'single-date' && (
          <motion.div
            key='single-date'
            custom={direction}
            variants={slideVariants}
            initial={isInitialMount ? false : 'enter'}
            animate='center'
            exit='exit'
            transition={transition}
            className='w-full'
          >
            <h1 className='text-4xl font-heading mt-10'>Event Date/Time</h1>
            <NewEventSingleDate
              onBack={handleDateBack}
              onNext={handleDateNext}
            />
          </motion.div>
        )}
        {step === 'multi-date' && (
          <motion.div
            key='multi-date'
            custom={direction}
            variants={slideVariants}
            initial={isInitialMount ? false : 'enter'}
            animate='center'
            exit='exit'
            transition={transition}
            className='w-full'
          >
            <h1 className='text-4xl font-heading mt-10'>
              Event Date/Time Options
            </h1>
            <NewEventMultiDate
              onBack={handleDateBack}
              onNext={handleDateNext}
            />
          </motion.div>
        )}
        {step === 'permissions' && (
          <motion.div
            key='permissions'
            custom={direction}
            variants={slideVariants}
            initial='enter'
            animate='center'
            exit='exit'
            transition={transition}
            className='w-full'
          >
            <h1 className='text-4xl font-heading mt-10'>Permissions</h1>
            <NewEventPermissions
              onBack={handlePermissionsBack}
              onNext={handlePermissionsNext}
            />
          </motion.div>
        )}
        {step === 'add-ons' && (
          <motion.div
            key='add-ons'
            custom={direction}
            variants={slideVariants}
            initial='enter'
            animate='center'
            exit='exit'
            transition={transition}
            className='w-full'
          >
            <h1 className='text-4xl font-heading mt-10'>Add-ons</h1>
            <NewEventAddons onBack={handleAddonsBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CreateWizard() {
  return (
    <FormProvider>
      <WizardContent />
    </FormProvider>
  );
}
