"use client";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Input } from "./ui/input";
import Link from "next/link";
import { Button } from "./ui/button";
import { Icons } from "./icons";
import { Card, CardContent } from "./ui/card";

export function NewEventSingleDate() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string | undefined>(
    new Date().toLocaleTimeString([], { timeStyle: "short", hour12: false })
  );

  const getDateTime = () => {
    return new Date(`${date?.toISOString().split("T")[0]}T${time}`);
  };

  return (
    <div className="my-8 flex flex-col gap-6">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border border-border w-max mx-auto"
      />
      <Input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-max mx-auto"
      />
      <div className="flex items-center rounded-lg border border-border p-4 max-w-sm mx-auto">
        <h2 className="text-xl font-semibold">
          {getDateTime().toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </h2>
      </div>
      <div className="flex justify-between">
        <Link href="/create/dateType">
          <Button className="flex items-center gap-1" variant={"secondary"}>
            <span>Back</span>
            <Icons.back className="text-sm" />
          </Button>
        </Link>
        <Button className="flex items-center gap-1">
          <span>Submit</span>
        </Button>
      </div>
    </div>
  );
}
