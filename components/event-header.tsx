import { Icons } from "@/components/icons";
import { Button } from "./ui/button";

interface EventHeaderProps {
  eventTitle: string;
  eventLocation: string;
  eventDate: string | null;
  eventDescription: string;
}

export default function EventHeader({
  eventTitle,
  eventLocation,
  eventDate,
  eventDescription,
}: EventHeaderProps) {
  return (
    <header className="flex flex-col mb-5 max-w-2xl mx-auto gap-3">
      <h1 className="text-4xl font-heading">{eventTitle}</h1>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.location className="w-6 h-6" />
          <span>{eventLocation}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.date className="w-6 h-6" />
          {eventDate !== null ? (
            <span>{eventDate}</span>
          ) : (
            <Button
              className="flex items-center gap-1"
              variant={"ghost"}
              size={"sm"}
            >
              <span>Set Availability</span>
              <Icons.arrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <p>{eventDescription}</p>
    </header>
  );
}
