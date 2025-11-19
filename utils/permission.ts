// utils/permission.ts

import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const requestStoragePermission = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() !== "android") return true;

  try {
    const permission = await Filesystem.requestPermissions();
    return permission.publicStorage === 'granted';
  } catch (error) {
    console.error("Error requesting storage permission:", error);
    return false;
  }
};
