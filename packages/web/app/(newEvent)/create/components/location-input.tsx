'use client';

import useOnclickOutside from 'react-cool-onclickoutside';
import { ControllerRenderProps } from 'react-hook-form';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useLoadScript } from '@react-google-maps/api';
import { env } from '@/env.mjs';
import { cn } from '@/lib/utils';

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = [
  'places',
];

type LocationFieldProps = ControllerRenderProps<
  {
    title: string;
    description?: string | undefined;
    location?: string | undefined;
    datetime?: string | undefined;
    potentialDateTimes?: string[] | undefined;
  },
  'location'
>;

function LocationInputAutocomplete({
  dataTest,
  field,
}: {
  dataTest: string;
  field: LocationFieldProps;
}) {
  const {
    ready,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here if needed */
    },
    debounce: 300,
  });

  // Extract field properties to avoid ref access warnings during render
  const {
    value: fieldValue,
    onChange: fieldOnChange,
    onBlur: fieldOnBlur,
    name: fieldName,
    ref: fieldRef,
  } = field;

  const handleSelect = (address: string) => {
    fieldOnChange(address);
    setValue(address, false);
    clearSuggestions();
  };

  const ref = useOnclickOutside(() => {
    clearSuggestions();
  });

  const hasSuggestions = status === 'OK' && data.length > 0;

  return (
    <div ref={ref} className='relative'>
      <input
        data-test={dataTest}
        className='flex h-10 w-full rounded-input border border-input bg-background px-4 py-2 text-base text-foreground ring-offset-background transition-all duration-fast placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50'
        disabled={!ready}
        placeholder="123 Main St... or 'My house'"
        value={fieldValue ?? ''}
        onChange={e => {
          fieldOnChange(e.target.value);
          setValue(e.target.value);
        }}
        onBlur={fieldOnBlur}
        name={fieldName}
        ref={fieldRef}
        autoComplete='off'
      />

      {hasSuggestions && (
        <ul className='absolute z-popover mt-1 w-full overflow-hidden rounded-dropdown border bg-popover p-1 shadow-floating'>
          <li className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
            Suggestions
          </li>
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className={cn(
                'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden',
                'hover:bg-accent hover:text-accent-foreground cursor-pointer'
              )}
              onMouseDown={e => {
                e.preventDefault();
                handleSelect(description);
              }}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LocationInput({
  dataTest,
  field,
}: {
  dataTest: string;
  field: LocationFieldProps;
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
    libraries,
  });

  // Extract field properties to avoid ref access warnings during render
  const {
    value: fieldValue,
    onChange: fieldOnChange,
    onBlur: fieldOnBlur,
    name: fieldName,
    ref: fieldRef,
  } = field;

  if (!isLoaded) {
    return (
      <input
        data-test={dataTest}
        className='flex h-10 w-full rounded-input border border-input bg-background px-4 py-2 text-base text-foreground ring-offset-background transition-all duration-fast placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50'
        disabled
        placeholder="123 Main St... or 'My house'"
        value={fieldValue ?? ''}
        onChange={fieldOnChange}
        onBlur={fieldOnBlur}
        name={fieldName}
        ref={fieldRef}
      />
    );
  }

  return <LocationInputAutocomplete dataTest={dataTest} field={field} />;
}
