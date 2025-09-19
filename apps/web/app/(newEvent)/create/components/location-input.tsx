import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import useOnclickOutside from 'react-cool-onclickoutside';
import { ControllerRenderProps } from 'react-hook-form';
import usePlacesAutocomplete from 'use-places-autocomplete';

export function LocationInput({
  dataTest,
  field,
}: {
  dataTest: string;
  field: ControllerRenderProps<
    {
      title: string;
      description?: string | undefined;
      location?: string | undefined;
      datetime?: string | undefined;
      potentialDateTimes?: string[] | undefined;
    },
    'location'
  >;
}) {
  const {
    ready,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ callbackName: 'initMap' });

  const handleSelect = (address: string) => {
    field.onChange(address);
    setValue(address, false);
    clearSuggestions();
  };

  const ref = useOnclickOutside(() => {
    // When the user clicks outside of the component, we can dismiss
    // the searched suggestions by calling this method
    clearSuggestions();
  });

  return (
    <div ref={ref}>
      <Command shouldFilter={false}>
        <CommandInput
          data-test={dataTest}
          className='text-foreground text-base'
          disabled={!ready}
          placeholder="123 Main St... or 'My house'"
          onValueChange={value => {
            field.onChange(value);
            setValue(value);
          }}
          {...field}
        />

        <CommandList>
          <CommandGroup heading={field.value ? 'Suggestions' : ''}>
            {status === 'OK' &&
              data.map(({ place_id, description }) => (
                <CommandItem key={place_id} onSelect={handleSelect}>
                  {description}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
