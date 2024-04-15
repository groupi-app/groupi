import { FormContextProvider } from "@/components/providers/form-context-provider";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FormContextProvider>{children}</FormContextProvider>;
}
