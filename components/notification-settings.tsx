"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addNotificationMethod,
  deleteNotificationMethod,
  getNotificationSettings,
  getNotificationTypeDisplayName,
  updateNotificationSettings,
} from "@/lib/actions/settings";
import { NotificationMethodType, NotificationType } from "@prisma/client";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const router = useRouter();

  const [settingsData, setSettingsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );
  const [newMethodType, setNewMethodType] = useState<
    NotificationMethodType | ""
  >("");
  const [newMethodValue, setNewMethodValue] = useState("");
  const [newMethodName, setNewMethodName] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, Record<NotificationType, boolean>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Get all notification types from enum
  const notificationTypes = Object.values(NotificationType);

  // Load notification settings on component mount
  useEffect(() => {
    async function loadSettings() {
      if (!userId) return;

      setIsLoading(true);
      try {
        const response = await getNotificationSettings(userId);
        setSettingsData(response);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [userId]);

  // Format method type for display
  const formatMethodType = (type: NotificationMethodType) => {
    return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");
  };

  // Get placeholder text for method value input
  const getMethodValuePlaceholder = (type: NotificationMethodType) => {
    switch (type) {
      case "EMAIL":
        return "Enter email address";
      case "SMS":
        return "Enter phone number";
      case "PUSH":
        return "Push notification token";
      case "WEBHOOK":
        return "Enter webhook URL";
      default:
        return "Enter value";
    }
  };

  // Reset form after adding a method
  const resetNewMethodForm = () => {
    setNewMethodType("");
    setNewMethodValue("");
    setNewMethodName("");
  };

  // Handle adding a new notification method
  const handleAddMethod = async () => {
    if (!newMethodType || !newMethodValue) return;

    try {
      await addNotificationMethod(userId, {
        type: newMethodType as NotificationMethodType,
        name:
          newMethodName ||
          `${formatMethodType(newMethodType as NotificationMethodType)}`,
        value: newMethodValue,
      });

      // Refresh data after adding
      const response = await getNotificationSettings(userId);
      setSettingsData(response);
      resetNewMethodForm();
    } catch (error) {
      console.error("Error adding notification method:", error);
    }
  };

  // Handle deleting a notification method
  const handleDeleteMethod = async (methodId: string) => {
    try {
      await deleteNotificationMethod(methodId);

      // Refresh data after deleting
      const response = await getNotificationSettings(userId);
      setSettingsData(response);

      // Remove pending changes for this method
      const newPendingChanges = { ...pendingChanges };
      delete newPendingChanges[methodId];
      setPendingChanges(newPendingChanges);

      // Update unsaved changes flag
      setHasUnsavedChanges(Object.keys(newPendingChanges).length > 0);
    } catch (error) {
      console.error("Error deleting notification method:", error);
    }
  };

  // Toggle a notification type for a method
  const toggleNotificationType = (
    methodId: string,
    type: NotificationType,
    checked: boolean
  ) => {
    const methodChanges =
      pendingChanges[methodId] ||
      // Initialize with current settings if available
      getInitialSettingsForMethod(methodId);

    const updatedChanges = {
      ...pendingChanges,
      [methodId]: {
        ...methodChanges,
        [type]: checked,
      },
    };

    setPendingChanges(updatedChanges);
    setHasUnsavedChanges(true);
  };

  // Get initial settings for a method from existing data
  const getInitialSettingsForMethod = (methodId: string) => {
    if (!settingsData?.success) return {};

    const method = settingsData.success.notificationMethods.find(
      (m: any) => m.id === methodId
    );
    if (!method) return {};

    const settings: Record<NotificationType, boolean> = {} as Record<
      NotificationType,
      boolean
    >;

    // Initialize with all notification types set to false
    notificationTypes.forEach((type) => {
      settings[type] = false;
    });

    // Set enabled settings based on existing data
    method.notifications.forEach((setting: any) => {
      settings[setting.notificationType] = setting.enabled;
    });

    return settings;
  };

  // Check if a notification type is enabled for a method
  const isNotificationEnabled = (methodId: string, type: NotificationType) => {
    // First check pending changes
    if (
      pendingChanges[methodId] &&
      pendingChanges[methodId][type] !== undefined
    ) {
      return pendingChanges[methodId][type];
    }

    // Fall back to current settings
    if (!settingsData?.success) return false;
    const method = settingsData.success.notificationMethods.find(
      (m: any) => m.id === methodId
    );
    if (!method) return false;

    const setting = method.notifications.find(
      (s: any) => s.notificationType === type
    );
    return setting ? setting.enabled : false;
  };

  // Save all pending changes
  const saveChanges = async () => {
    try {
      setIsSaving(true);
      // Update settings for each method with pending changes
      const promises = Object.entries(pendingChanges).map(
        ([methodId, settings]) => {
          return updateNotificationSettings(methodId, settings);
        }
      );

      await Promise.all(promises);

      // Refresh data after saving
      const response = await getNotificationSettings(userId);
      setSettingsData(response);

      setPendingChanges({});
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle card expanded state
  const toggleCardExpanded = (methodId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [methodId]: !prev[methodId],
    }));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-medium">Notification Methods</h2>
        <p className="text-gray-500 text-sm">
          Add notification methods and choose which types of notifications to
          send to each method.
        </p>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2 min-w-[200px]">
            <Label htmlFor="method-type">Notification Method</Label>
            <Select
              value={newMethodType}
              onValueChange={(value) =>
                setNewMethodType(value as NotificationMethodType)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(NotificationMethodType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatMethodType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newMethodType && (
            <>
              <div className="space-y-2 flex-1">
                <Label htmlFor="method-name">Display Name (Optional)</Label>
                <Input
                  id="method-name"
                  placeholder="My personal email"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="method-value">
                  {formatMethodType(newMethodType as NotificationMethodType)}{" "}
                  Value
                </Label>
                <Input
                  id="method-value"
                  placeholder={getMethodValuePlaceholder(
                    newMethodType as NotificationMethodType
                  )}
                  value={newMethodValue}
                  onChange={(e) => setNewMethodValue(e.target.value)}
                  type={newMethodType === "EMAIL" ? "email" : "text"}
                />
              </div>
            </>
          )}

          <Button
            onClick={handleAddMethod}
            disabled={!newMethodType || !newMethodValue}
            className="flex gap-2 items-center"
          >
            <PlusIcon size={16} />
            <span>Add Method</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {!settingsData?.success?.notificationMethods.length ? (
          <div className="text-center py-8 text-gray-500">
            <p>No notification methods added yet.</p>
            <p className="text-sm">
              Add a notification method above to get started.
            </p>
          </div>
        ) : (
          settingsData.success.notificationMethods.map((method: any) => (
            <Card key={method.id} className="w-full">
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleCardExpanded(method.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>{method.name}</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({method.value})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMethod(method.id);
                      }}
                    >
                      <TrashIcon size={16} className="text-red-500" />
                    </Button>
                    {expandedCards[method.id] ? (
                      <ChevronUpIcon size={20} />
                    ) : (
                      <ChevronDownIcon size={20} />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedCards[method.id] && (
                <CardContent>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium mb-4">
                      Notification Types
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {notificationTypes.map((type) => (
                        <div key={type} className="flex items-start space-x-2">
                          <Checkbox
                            id={`${method.id}-${type}`}
                            checked={isNotificationEnabled(method.id, type)}
                            onCheckedChange={(checked) =>
                              toggleNotificationType(
                                method.id,
                                type,
                                checked === true
                              )
                            }
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor={`${method.id}-${type}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {getNotificationTypeDisplayName(type)}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Alert className="bg-primary text-primary-foreground flex items-center justify-between p-4 shadow-lg">
            <AlertDescription>You have unsaved changes</AlertDescription>
            <Button
              variant="secondary"
              size="sm"
              onClick={saveChanges}
              disabled={isSaving}
            >
              Save Changes
            </Button>
          </Alert>
        </div>
      )}
    </div>
  );
}
