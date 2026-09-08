export const CADT_EMAIL_PATTERN =
  String.raw`[A-Za-z0-9._%+-]+@[cC][aA][dD][tT]\.[eE][dD][uU]\.[kK][hH]`;

export const CADT_EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@cadt\.edu\.kh$/i;

export const GROUP_CAPACITY = 32;

export const GROUPS = [
  {
    id: "ds-1",
    track: "Data Science",
    groupName: "Group 1",
    accent: "#0d6f66",
    softAccent: "#e3f4ef",
  },
  {
    id: "ds-2",
    track: "Data Science",
    groupName: "Group 2",
    accent: "#178064",
    softAccent: "#e6f5eb",
  },
  {
    id: "ds-3",
    track: "Data Science",
    groupName: "Group 3",
    accent: "#2b8c6f",
    softAccent: "#ebf7ef",
  },
  {
    id: "se-1",
    track: "Software Engineering",
    groupName: "Group 1",
    accent: "#1f5f9f",
    softAccent: "#e7f0fb",
  },
  {
    id: "se-2",
    track: "Software Engineering",
    groupName: "Group 2",
    accent: "#315bb8",
    softAccent: "#ebeffc",
  },
  {
    id: "se-3",
    track: "Software Engineering",
    groupName: "Group 3",
    accent: "#4f5fbf",
    softAccent: "#eff0fc",
  },
] as const;

export type GroupId = (typeof GROUPS)[number]["id"];

export function getGroupById(groupId: string) {
  return GROUPS.find((group) => group.id === groupId);
}

export function isCadtEmail(email: string) {
  return CADT_EMAIL_REGEX.test(email);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
