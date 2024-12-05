"use client";

import { Button } from "./ui/button";
import { Icons } from "./icons";
import { PotentialDateTimeWithAvailabilities } from "@/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AvailabilityCard({
  pdt,
  formAnswers,
  setFormAnswer,
  index,
}: {
  pdt: PotentialDateTimeWithAvailabilities;
  formAnswers: { potentialDateTimeId: string; answer: string }[];
  setFormAnswer: (index: number, value: any) => void;
  index: number;
}) {
  const answer = formAnswers[index]?.answer;

  return (
    <div className="w-full md:max-w-md border border-border shadow-md rounded-md py-2 px-3 ">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col justify-between ">
          <div>
            <h1>
              {pdt.dateTime.toLocaleDateString([], { dateStyle: "long" })}
            </h1>
            <h2 className="text-muted-foreground text-sm">
              {pdt.dateTime.toLocaleTimeString([], { timeStyle: "short" })}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Icons.check className="w-4 h-4 text-muted-foreground" />
              <span>
                {pdt.availabilities
                  .filter((a) => a.status === "YES")
                  .length.toString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">?</span>
              <span>
                {pdt.availabilities
                  .filter((a) => a.status === "MAYBE")
                  .length.toString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icons.close className="w-4 h-4 text-muted-foreground" />
              <span>
                {pdt.availabilities
                  .filter((a) => a.status === "NO")
                  .length.toString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "text-muted-foreground",
              answer === "yes" &&
                "bg-green-500 hover:bg-green-500 text-primary-foreground"
            )}
            onClick={() =>
              setFormAnswer(index, {
                potentialDateTimeId: pdt.id,
                answer: "yes",
              })
            }
          >
            <Icons.check />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "text-muted-foreground",
              answer === "maybe" &&
                "bg-yellow-500 hover:bg-yellow-500 text-primary-foreground"
            )}
            onClick={() =>
              setFormAnswer(index, {
                potentialDateTimeId: pdt.id,
                answer: "maybe",
              })
            }
          >
            <span className="font-semibold text-lg">?</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "text-muted-foreground",
              answer === "no" &&
                "bg-red-500 hover:bg-red-500 text-primary-foreground"
            )}
            onClick={() =>
              setFormAnswer(index, {
                potentialDateTimeId: pdt.id,
                answer: "no",
              })
            }
          >
            <Icons.close />
          </Button>
        </div>
      </div>
    </div>
  );
}
