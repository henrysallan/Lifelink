import type { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhoto: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  timestamp: Timestamp | null;  // Allow null
  deviceInfo?: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}