import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmCard } from "./confirm-card";
import { useState } from "react";

export function SettingsModal() {
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  return (
    <DialogContent>
      <div className="flex flex-col max-w-2xl relative">
        <DialogHeader className="pb-3">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your account and appearance settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 flex-grow h-2/3">
          <div className="col-span-0 sm:col-span-1 border-r-[1px] border-border"></div>
          <div className="col-span-4 sm:col-span-3 overflow-y-auto h-full px-3">
            <button
              onClick={() => {
                setConfirmOpen(!confirmOpen);
              }}
            >
              CLICK
            </button>
            <ul className="divide-solid divide-border divide-y-[1px] pb-20">
              <li className="py-5">test</li>
              <li className="py-5">test</li>
              <li className="py-5">test</li>
              <li className="py-5">test</li>
              <li className="py-5">test</li>
              <li className="py-5">test</li>
              <li className="py-5">hi</li>
            </ul>
          </div>
        </div>
        <ConfirmCard open={confirmOpen} />
      </div>
    </DialogContent>
  );
}
