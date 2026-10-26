export const roles = ["user", "critic", "editor", "admin"] as const;
export type Role = (typeof roles)[number];

export function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}

/** Hierarquia: cada papel herda as permissões dos anteriores. */
export function hasRole(actual: string | null | undefined, required: Role): boolean {
  const a = roles.indexOf((actual ?? "user") as Role);
  return a >= roles.indexOf(required);
}
