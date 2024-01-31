import { $Enums } from "@prisma/client";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Icons } from "@/components/icons";
import React from "react";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
    var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
    var interval = seconds / 31536000;
  
    if (interval > 1) {
      return Math.floor(interval) + "y";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + "mon";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + "d";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + "h";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + "min";
    }
    return Math.floor(seconds) + " seconds";
}

export function getFullName(firstName:string|null|undefined, lastName:string|null|undefined): string{
  if (firstName && lastName) {
    return firstName + " " + lastName;
  } else if (firstName && !lastName) {
    return firstName;
  } else if (!firstName && lastName) {
    return lastName;
  }
  return "Name not found"
}

export function formatRoleName(role: $Enums.Role | undefined){
  if (!role) {
    return "Unknown"
  }
  switch(role){
    case "ATTENDEE":
      return "Attendee"
    case "MODERATOR":
      return "Moderator"
    case "ORGANIZER":
      return "Organizer"
    default:
      return "Unknown"
  }
}

export function formatRoleBadge(role: $Enums.Role | undefined){
  if (!role) {
    return "Unknown"
  }
  switch(role){
    case "ATTENDEE":
      return React.createElement(Icons.account, {className: "w-4 h-4"});
    case "MODERATOR":
      return React.createElement(Icons.shield, {className: "w-4 h-4"});
    case "ORGANIZER":
      return React.createElement(Icons.crown, {className: "w-4 h-4"});
    default:
      return React.createElement('<span>Unknown</span>');
  }
}