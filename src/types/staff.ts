export interface Staff {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: "admin" | "manager" | "staff";
  status: "active" | "invited" | "inactive";
  joinedDate: string;
  avatar: string | null;
}

export interface StaffFormValues {
  userId: string;
  role: "admin" | "manager" | "staff";
  status: "active" | "invited" | "inactive";
  avatar?: FileList | null;
}

export interface StaffPermissions {
  canDelete: boolean;
  canEdit: boolean;
  canView: boolean;
  canCreate: boolean;
}
