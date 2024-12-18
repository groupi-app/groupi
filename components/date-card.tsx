"use client";

import { PotentialDateTimeWithAvailabilities } from "@/types";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { MemberSlate } from "./member-slate";
import { Role } from "@prisma/client";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { chooseDateTime } from "@/lib/actions/availability";
import { useToast } from "./ui/use-toast";
import { useRouter } from "next/navigation";

export function DateCard({
  pdt,
  userId,
  userRole,
}: {
  pdt: PotentialDateTimeWithAvailabilities & { rank: number };
  userId: string;
  userRole: Role;
}) {
  const yesAmount = pdt.availabilities.filter((a) => a.status === "YES").length;
  const maybeAmount = pdt.availabilities.filter(
    (a) => a.status === "MAYBE"
  ).length;
  const noAmount = pdt.availabilities.filter((a) => a.status === "NO").length;
  const [selectedTab, setSelectedTab] = useState("yes");
  const [dialogType, setDialogType] = useState<"overview" | "confirm">(
    "overview"
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function selectDate() {
    setIsLoading(true);
    const res = await chooseDateTime(pdt.eventId, pdt.id);
    if (res.error) {
      toast({
        title: "Error selecting date",
        description: "The date could not be selected. Please try again.",
      });
    }
    if (res.success) {
      toast({
        title: "Date selected!",
        description: "The date has been successfully selected.",
      });
      router.push(`/event/${pdt.eventId}`);
    }
    setIsLoading(false);
  }

  return (
    <Dialog>
      <DialogTrigger
        asChild
        onClick={() => {
          setDialogType("overview");
        }}
      >
        <div className="w-full md:max-w-md border border-border shadow-md rounded-md py-2 px-3 hover:bg-accent transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-2xl">#{pdt.rank}</h1>
            <div className="flex flex-col">
              <h1>
                {pdt.dateTime.toLocaleDateString([], { dateStyle: "long" })}
              </h1>
              <span className="text-sm text-muted-foreground">
                {pdt.dateTime.toLocaleTimeString([], { timeStyle: "short" })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Icons.check className="w-6 h-6 rounded-full  text-green-500" />
              <span>{yesAmount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="rounded-full w-6 h-6 text-center font-semibold text-yellow-500 cursor-default">
                <span>?</span>
              </div>
              <span>{maybeAmount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icons.close className="w-6 h-6 rounded-full text-red-500" />

              <span>{noAmount}</span>
            </div>
          </div>
          <div className="w-full rounded-full border border-border h-4 flex items-center">
            <div
              className={cn(
                "h-full bg-green-500 rounded-l-full",
                maybeAmount === 0 && noAmount === 0 ? "rounded-r-full" : ""
              )}
              style={{
                width: `${(yesAmount / pdt.availabilities.length) * 100}%`,
              }}
            />
            <div
              className={cn(
                "h-full bg-yellow-500",
                yesAmount === 0 ? "rounded-l-full" : "",
                noAmount === 0 ? "rounded-r-full" : ""
              )}
              style={{
                width: `${(maybeAmount / pdt.availabilities.length) * 100}%`,
              }}
            />
            <div
              className={cn(
                " h-full bg-red-500 rounded-r-full",
                yesAmount === 0 && maybeAmount === 0 ? "rounded-l-full" : ""
              )}
              style={{
                width: `${(noAmount / pdt.availabilities.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        {dialogType === "overview" && (
          <>
            <DialogHeader className="text-left">
              <h1 className="font-semibold text-2xl">
                {pdt.dateTime.toLocaleDateString([], { dateStyle: "long" })}
              </h1>
              <h2 className="text-muted-foreground text-lg">
                {pdt.dateTime.toLocaleTimeString([], { timeStyle: "short" })}
              </h2>
            </DialogHeader>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="yes">
                  <div className="flex items-center gap-1">
                    <span>Yes</span>
                    <div
                      className={cn(
                        "rounded-full w-5 h-5 text-center text-muted-foreground cursor-default flex items-center justify-center",
                        selectedTab === "yes" &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      <span>{yesAmount}</span>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="maybe">
                  <div className="flex items-center gap-1">
                    <span>Maybe</span>
                    <div
                      className={cn(
                        "rounded-full w-5 h-5 text-center text-muted-foreground cursor-default flex items-center justify-center",
                        selectedTab === "maybe" &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      <span>{maybeAmount}</span>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="no">
                  <div className="flex items-center gap-1">
                    <span>No</span>
                    <div
                      className={cn(
                        "rounded-full w-5 h-5 text-center text-muted-foreground cursor-default flex items-center justify-center",
                        selectedTab === "no" &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      <span>{noAmount}</span>
                    </div>
                  </div>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="yes">
                <ScrollArea className="h-64">
                  <div className="flex flex-col divide-y">
                    {pdt.availabilities
                      .filter((a) => a.status === "YES")
                      .map((availability, i) => (
                        <MemberSlate
                          key={availability.membershipId}
                          member={availability.membership}
                          userId={userId}
                          userRole={userRole}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="maybe">
                <ScrollArea className="h-64">
                  <div className="flex flex-col divide-y">
                    {pdt.availabilities
                      .filter((a) => a.status === "MAYBE")
                      .map((availability, i) => (
                        <MemberSlate
                          key={availability.membershipId}
                          member={availability.membership}
                          userId={userId}
                          userRole={userRole}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="no">
                <ScrollArea className="h-64">
                  <div className="flex flex-col divide-y">
                    {pdt.availabilities
                      .filter((a) => a.status === "NO")
                      .map((availability, i) => (
                        <MemberSlate
                          key={availability.membershipId}
                          member={availability.membership}
                          userId={userId}
                          userRole={userRole}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-1 items-center ">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  setDialogType("confirm");
                }}
              >
                Select This Date
              </Button>
            </div>
          </>
        )}
        {dialogType === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>
                <h1 className="font-semibold text-2xl">Confirm Selection</h1>
              </DialogTitle>
              <DialogDescription>
                <p className="text-muted-foreground">
                  Are you sure you want to select this date? If you change your
                  mind, you can always pick a different date or run a new poll.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setDialogType("overview");
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <DialogClose asChild>
                <Button
                  className="flex items-center gap-1"
                  onClick={selectDate}
                >
                  {isLoading && (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  )}
                  <span>Confirm</span>
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
