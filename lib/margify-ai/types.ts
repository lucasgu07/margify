export type MargifyAIChatRole = "user" | "assistant";

export type MargifyAIChatMessage = {
  id: string;
  role: MargifyAIChatRole;
  content: string;
  createdAt: number;
};

/** Payload enviado al API (sin id ni timestamps). */
export type MargifyAIApiMessage = {
  role: MargifyAIChatRole;
  content: string;
};
