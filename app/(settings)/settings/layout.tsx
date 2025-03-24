import { SettingsNav } from "@/components/settings-nav";
import { $Enums } from "@prisma/client";
import { z } from "zod";

export default async function SettingsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const formSchema = z.object({
    notificationMethods: z.array(
      z.object({
        type: z.enum(
          Object.values($Enums.NotificationMethodType) as [string, ...string[]]
        ),
      })
    ),
  });
  return (
    <div className="container relative md:grid md:grid-cols-[175px_1fr]">
      <SettingsNav />
      <div className="relative ">{children}</div>
    </div>
  );
}
