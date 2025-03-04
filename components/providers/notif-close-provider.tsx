import { createContext, ReactNode, useContext, useState } from "react";

type NotificationCloseContextType = {
  popoverOpen: boolean;
  sheetOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  setSheetOpen: (open: boolean) => void;
};

const NotificationCloseContext = createContext<
  NotificationCloseContextType | undefined
>(undefined);

export function NotificationCloseContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <NotificationCloseContext.Provider
      value={{
        popoverOpen,
        sheetOpen,
        setPopoverOpen,
        setSheetOpen,
      }}
    >
      {children}
    </NotificationCloseContext.Provider>
  );
}

export function useNotificationCloseContext() {
  const context = useContext(NotificationCloseContext);
  if (!context) {
    throw new Error(
      "useNotificationCloseContext must be used within NotificationCloseContext.Provider"
    );
  }
  return context;
}
