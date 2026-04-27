import { useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { BackButton } from '@/components/ui/back-button';
import { router } from 'expo-router';
import Animated, {
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

import {
  CreateEventProvider,
  useCreateEventForm,
} from '@/context/create-event-context';
import { StepIndicator } from '@/components/create-event/step-indicator';
import { EventInfoStep } from '@/components/create-event/event-info-step';
import { DateTypeStep } from '@/components/create-event/date-type-step';
import { SingleDateStep } from '@/components/create-event/single-date-step';
import { MultiDateStep } from '@/components/create-event/multi-date-step';
import { ReviewStep } from '@/components/create-event/review-step';

type Step = 'info' | 'date-type' | 'single-date' | 'multi-date' | 'review';

const STEP_ORDER: Record<Step, number> = {
  info: 0,
  'date-type': 1,
  'single-date': 2,
  'multi-date': 2,
  review: 3,
};

const STEP_TITLES: Record<Step, string> = {
  info: 'Details',
  'date-type': 'Date',
  'single-date': 'Date & Time',
  'multi-date': 'Date Options',
  review: 'Review',
};

const ANIMATION_DURATION = 250;

function WizardContent() {
  const { updateFormState } = useCreateEventForm();
  const [step, setStep] = useState<Step>('info');
  const [direction, setDirection] = useState<1 | -1>(1);
  const pendingStepRef = useRef<Step | null>(null);

  // Two-phase transition: update direction first so the current Animated.View
  // picks up the new exiting animation, then change the step on the next frame
  // so reanimated unmounts with the correct exit direction.
  const goToStep = useCallback(
    (newStep: Step) => {
      if (pendingStepRef.current !== null) return; // prevent double-tap
      const currentOrder = STEP_ORDER[step];
      const newOrder = STEP_ORDER[newStep];
      setDirection(newOrder > currentOrder ? 1 : -1);
      pendingStepRef.current = newStep;
      requestAnimationFrame(() => {
        if (pendingStepRef.current !== null) {
          setStep(pendingStepRef.current);
          pendingStepRef.current = null;
        }
      });
    },
    [step]
  );

  function handleInfoNext() {
    goToStep('date-type');
  }

  function handleSelectSingle() {
    updateFormState({ dateType: 'single' });
    goToStep('single-date');
  }

  function handleSelectMulti() {
    updateFormState({ dateType: 'multi' });
    goToStep('multi-date');
  }

  function handleDateTypeBack() {
    goToStep('info');
  }

  function handleDateNext() {
    goToStep('review');
  }

  function handleDateBack() {
    goToStep('date-type');
  }

  const entering =
    direction === 1
      ? SlideInRight.duration(ANIMATION_DURATION)
      : SlideInLeft.duration(ANIMATION_DURATION);

  const exiting =
    direction === 1
      ? SlideOutLeft.duration(ANIMATION_DURATION)
      : SlideOutRight.duration(ANIMATION_DURATION);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      {/* Header */}
      <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
        <BackButton
          onPress={() => {
            if (step === 'info') {
              router.back();
            } else if (step === 'date-type') {
              handleDateTypeBack();
            } else if (step === 'single-date' || step === 'multi-date') {
              handleDateBack();
            } else if (step === 'review') {
              // Go back to whichever date step was used
              goToStep('date-type');
            }
          }}
        />
        <Text className='text-lg font-semibold text-foreground'>
          {STEP_TITLES[step]}
        </Text>
        <View className='w-10' />
      </View>

      {/* Step indicator */}
      <StepIndicator totalSteps={4} currentStep={STEP_ORDER[step]} />

      {/* Step content */}
      <Animated.View
        key={step}
        entering={entering}
        exiting={exiting}
        className='flex-1'
      >
        {step === 'info' ? (
          <EventInfoStep onNext={handleInfoNext} />
        ) : step === 'date-type' ? (
          <DateTypeStep
            onSelectSingle={handleSelectSingle}
            onSelectMulti={handleSelectMulti}
            onBack={handleDateTypeBack}
          />
        ) : step === 'single-date' ? (
          <SingleDateStep onNext={handleDateNext} onBack={handleDateBack} />
        ) : step === 'multi-date' ? (
          <MultiDateStep onNext={handleDateNext} onBack={handleDateBack} />
        ) : (
          <ReviewStep onBack={() => goToStep('date-type')} />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

export default function CreateEventScreen() {
  return (
    <CreateEventProvider>
      <WizardContent />
    </CreateEventProvider>
  );
}
