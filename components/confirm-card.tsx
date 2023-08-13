import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/button";

export function ConfirmCard({ open }: { open: boolean }) {
  return (
    <Card
      className={`transition-all w-full bottom-0 flex items-center shadow-md justify-between ${
        open ? "absolute" : "hidden"
      }`}
    >
      <CardHeader className="flex items-center space-y-0 p-3">
        <CardTitle className="text-sm sm:text-base">
          You have unsaved changes!
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center pt-4 p-4 gap-3">
        <Button variant="link">Reset</Button>
        <Button className="h-9">Save</Button>
      </CardContent>
    </Card>
  );
}
