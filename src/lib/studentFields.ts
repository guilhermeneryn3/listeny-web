/**
 * Catálogo dos campos do cadastro de aluno. O professor escolhe quais entram e quais são
 * obrigatórios (config por org em `org_student_form.fields`); a mesma config vale no formulário
 * do professor e no link público de autocadastro. Campos `core` mapeiam colunas de `students`;
 * o resto vai em `students.profile` (jsonb).
 */
export type FieldType = "text" | "email" | "tel" | "date" | "select" | "textarea" | "url";

export type StudentField = {
  key: string;
  label: string;
  type: FieldType;
  core?: boolean; // grava em coluna de students (senão em profile jsonb)
  options?: string[]; // para type=select
  alwaysOn?: boolean; // sempre habilitado (só "name")
};

export const STUDENT_FIELDS: StudentField[] = [
  { key: "name", label: "Nome", type: "text", core: true, alwaysOn: true },
  { key: "email", label: "E-mail", type: "email", core: true },
  { key: "phone", label: "Telefone", type: "tel", core: true },
  { key: "avatar_url", label: "Foto (URL)", type: "url", core: true },
  { key: "birthdate", label: "Data de nascimento", type: "date" },
  { key: "document", label: "Documento (CPF/RG)", type: "text" },
  { key: "gender", label: "Gênero", type: "select", options: ["Feminino", "Masculino", "Outro", "Prefiro não informar"] },
  { key: "address", label: "Endereço", type: "text" },
  { key: "address_number", label: "Número", type: "text" },
  { key: "address_city", label: "Cidade", type: "text" },
  { key: "address_state", label: "UF", type: "text" },
  { key: "address_zip", label: "CEP", type: "text" },
  { key: "guardian_name", label: "Responsável — nome", type: "text" },
  { key: "guardian_phone", label: "Responsável — telefone", type: "tel" },
  { key: "guardian_relationship", label: "Responsável — relação", type: "text" },
  { key: "emergency_name", label: "Emergência — nome", type: "text" },
  { key: "emergency_phone", label: "Emergência — telefone", type: "tel" },
  { key: "goal", label: "Objetivo", type: "textarea" },
  { key: "notes", label: "Observações", type: "textarea", core: true },
];

export const CORE_KEYS = STUDENT_FIELDS.filter((f) => f.core).map((f) => f.key);

export function studentField(key: string): StudentField | undefined {
  return STUDENT_FIELDS.find((f) => f.key === key);
}
export function isCoreField(key: string): boolean {
  return !!studentField(key)?.core;
}

/** Config de um campo escolhido pelo org. Presença na lista = habilitado; ordem = ordem. */
export type FieldConfig = { key: string; required: boolean };

export const DEFAULT_FIELDS: FieldConfig[] = [
  { key: "name", required: true },
  { key: "email", required: false },
  { key: "phone", required: false },
];

/** Config efetiva: só chaves válidas, com "name" sempre presente, obrigatório e no topo. */
export function effectiveFields(raw: FieldConfig[] | null | undefined): FieldConfig[] {
  const list = (raw && raw.length ? raw : DEFAULT_FIELDS).filter((f) => studentField(f.key) && f.key !== "name");
  return [{ key: "name", required: true }, ...list];
}
