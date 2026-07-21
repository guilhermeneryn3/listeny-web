/**
 * Catálogo de e-mails automáticos (professor → aluno). Fonte única dos tipos; o org configura
 * cada um (ligar/desligar + assunto/texto) em `org_email_templates`. Disparo real é follow-up
 * (infra de e-mail/Resend). Variáveis como {aluno}/{portal} serão resolvidas no envio.
 */
export type EmailKey = "welcome" | "charge_due" | "new_lesson" | "session_reminder";

export type EmailType = {
  key: EmailKey;
  label: string;
  description: string;
  defaultSubject: string;
  defaultBody: string;
};

export const EMAIL_TYPES: EmailType[] = [
  {
    key: "welcome",
    label: "Boas-vindas",
    description: "Enviado quando o aluno recebe acesso ao portal.",
    defaultSubject: "Bem-vindo(a) a {portal}!",
    defaultBody: "Olá, {aluno}!\n\nSeu acesso está pronto. Entre no portal para ver suas aulas e sua agenda.\n\nAté breve!",
  },
  {
    key: "charge_due",
    label: "Lembrete de cobrança",
    description: "Enviado quando uma cobrança está próxima do vencimento.",
    defaultSubject: "Lembrete: cobrança em {portal}",
    defaultBody: "Olá, {aluno}!\n\nVocê tem uma cobrança em aberto. Acesse o portal para ver os detalhes.\n\nObrigado!",
  },
  {
    key: "new_lesson",
    label: "Nova aula",
    description: "Enviado quando uma aula ou tarefa é atribuída ao aluno.",
    defaultSubject: "Nova aula em {portal}",
    defaultBody: "Olá, {aluno}!\n\nUma nova aula foi publicada para você. Entre no portal para assistir.\n\nBons estudos!",
  },
  {
    key: "session_reminder",
    label: "Lembrete de sessão",
    description: "Enviado antes de uma sessão agendada.",
    defaultSubject: "Sua sessão está chegando",
    defaultBody: "Olá, {aluno}!\n\nEste é um lembrete da sua próxima sessão. Nos vemos lá!",
  },
];

export function emailType(key: string): EmailType | undefined {
  return EMAIL_TYPES.find((e) => e.key === key);
}
