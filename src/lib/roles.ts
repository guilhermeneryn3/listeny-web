/**
 * Papéis de acesso (RBAC) — fonte única do "quem é o quê". Espelha o enum `membership_role`
 * do banco + o dono do org. Matriz de capacidade no código (extensível; grants finos podem ser
 * somados depois sem quebrar isto).
 */
export type Role =
  | "owner"
  | "director"
  | "coordinator"
  | "teacher"
  | "staff"
  | "student"
  | "parent";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Dono",
  director: "Diretor",
  coordinator: "Coordenador",
  teacher: "Professor",
  staff: "Equipe",
  student: "Aluno",
  parent: "Responsável",
};

/** Papéis que acessam o painel de gestão (`/gerenciar`). */
export const MANAGER_ROLES: Role[] = ["owner", "director", "coordinator", "teacher", "staff"];
/** Papéis com poder administrativo do org (equipe, convites, config). */
export const ADMIN_ROLES: Role[] = ["owner", "director"];
/** Papéis que podem ser convidados como colaboradores. */
export const INVITABLE_ROLES: Role[] = ["director", "coordinator", "teacher", "staff"];

export function isManager(role: Role): boolean {
  return MANAGER_ROLES.includes(role);
}
export function isAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}
