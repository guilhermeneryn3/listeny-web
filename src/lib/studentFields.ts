/**
 * Catálogo dos campos do cadastro de aluno, agrupados por seção. O professor escolhe quais
 * entram e quais são obrigatórios (config por org em `org_student_form.fields`); a mesma config
 * vale no formulário do professor e no link público de autocadastro. Campos `core` mapeiam
 * colunas de `students`; o resto (inclusive a ficha de saúde) vai em `students.profile` (jsonb).
 */
export type FieldType = "text" | "email" | "tel" | "date" | "select" | "textarea" | "url";

export const FIELD_GROUPS = ["Dados", "Endereço", "Responsável e emergência", "Ficha de saúde"] as const;
export type FieldGroup = (typeof FIELD_GROUPS)[number];

export type StudentField = {
  key: string;
  label: string;
  type: FieldType;
  group: FieldGroup;
  core?: boolean; // grava em coluna de students (senão em profile jsonb)
  options?: string[]; // para type=select
  alwaysOn?: boolean; // sempre habilitado (só "name")
};

export const STUDENT_FIELDS: StudentField[] = [
  // Dados
  { key: "name", label: "Nome", type: "text", group: "Dados", core: true, alwaysOn: true },
  { key: "email", label: "E-mail", type: "email", group: "Dados", core: true },
  { key: "phone", label: "Telefone", type: "tel", group: "Dados", core: true },
  { key: "avatar_url", label: "Foto (URL)", type: "url", group: "Dados", core: true },
  { key: "birthdate", label: "Data de nascimento", type: "date", group: "Dados" },
  { key: "document", label: "Documento (CPF/RG)", type: "text", group: "Dados" },
  { key: "gender", label: "Gênero", type: "select", group: "Dados", options: ["Feminino", "Masculino", "Outro", "Prefiro não informar"] },
  { key: "goal", label: "Objetivo", type: "textarea", group: "Dados" },
  { key: "notes", label: "Observações", type: "textarea", group: "Dados", core: true },

  // Endereço
  { key: "address", label: "Endereço", type: "text", group: "Endereço" },
  { key: "address_number", label: "Número", type: "text", group: "Endereço" },
  { key: "address_city", label: "Cidade", type: "text", group: "Endereço" },
  { key: "address_state", label: "UF", type: "text", group: "Endereço" },
  { key: "address_zip", label: "CEP", type: "text", group: "Endereço" },

  // Responsável e emergência
  { key: "guardian_name", label: "Responsável — nome", type: "text", group: "Responsável e emergência" },
  { key: "guardian_phone", label: "Responsável — telefone", type: "tel", group: "Responsável e emergência" },
  { key: "guardian_relationship", label: "Responsável — relação", type: "text", group: "Responsável e emergência" },
  { key: "emergency_name", label: "Emergência — nome", type: "text", group: "Responsável e emergência" },
  { key: "emergency_phone", label: "Emergência — telefone", type: "tel", group: "Responsável e emergência" },

  // Ficha de saúde
  { key: "blood_type", label: "Tipo sanguíneo", type: "select", group: "Ficha de saúde", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"] },
  { key: "health_insurance", label: "Convênio / plano de saúde", type: "text", group: "Ficha de saúde" },
  { key: "weight", label: "Peso (kg)", type: "text", group: "Ficha de saúde" },
  { key: "height", label: "Altura (cm)", type: "text", group: "Ficha de saúde" },
  { key: "allergies", label: "Alergias", type: "textarea", group: "Ficha de saúde" },
  { key: "medications", label: "Medicamentos em uso", type: "textarea", group: "Ficha de saúde" },
  { key: "health_conditions", label: "Condições de saúde / histórico médico", type: "textarea", group: "Ficha de saúde" },
  { key: "injuries", label: "Lesões / restrições", type: "textarea", group: "Ficha de saúde" },
  { key: "health_notes", label: "Observações de saúde", type: "textarea", group: "Ficha de saúde" },
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

/** Catálogo agrupado por seção (para o configurador). */
export function catalogByGroup(): { group: FieldGroup; items: StudentField[] }[] {
  return FIELD_GROUPS.map((group) => ({ group, items: STUDENT_FIELDS.filter((f) => f.group === group) }));
}

/** Campos escolhidos agrupados por seção (para o formulário) — só grupos com itens. */
export function fieldsByGroup(fields: FieldConfig[]): { group: FieldGroup; items: FieldConfig[] }[] {
  return FIELD_GROUPS.map((group) => ({
    group,
    items: fields.filter((fc) => studentField(fc.key)?.group === group),
  })).filter((x) => x.items.length > 0);
}
