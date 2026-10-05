export const ROLES = ["admin", "editor", "viewer"] as const
export type Role = (typeof ROLES)[number]

export type Permission =
  | "view_content"
  | "edit_content"
  | "publish_content"
  | "manage_media"
  | "manage_design"
  | "manage_navigation"
  | "manage_users"

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_content: "View pages and drafts",
  edit_content: "Edit pages and save drafts",
  publish_content: "Publish pages to the live site",
  manage_media: "Upload and delete media",
  manage_design: "Change colors, fonts and layout",
  manage_navigation: "Edit the site menu",
  manage_users: "Create, edit and remove users",
}

export const ROLE_DETAILS: Record<Role, { label: string; description: string; permissions: Permission[] }> = {
  admin: {
    label: "Admin",
    description: "Full access, including publishing and managing users.",
    permissions: [
      "view_content",
      "edit_content",
      "publish_content",
      "manage_media",
      "manage_design",
      "manage_navigation",
      "manage_users",
    ],
  },
  editor: {
    label: "Editor",
    description: "Can edit pages and save drafts. An admin publishes them.",
    permissions: ["view_content", "edit_content", "manage_media", "manage_design", "manage_navigation"],
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to review pages and drafts.",
    permissions: ["view_content"],
  },
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
}

export function hasPermission(role: string | null | undefined, permission: Permission) {
  return isRole(role) && ROLE_DETAILS[role].permissions.includes(permission)
}
