export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Permission = 'READ' | 'WRITE' | 'ADMIN';

export interface Share {
  id: string;
  fileId: string | null;
  folderId: string | null;
  sharedById: string;
  sharedWithId: string;
  permission: Permission;
  createdAt: Date;
  expiresAt: Date | null;
}
