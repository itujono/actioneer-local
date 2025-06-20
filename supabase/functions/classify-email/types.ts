// Classification types and interfaces

export interface EmailData {
  subject: string;
  from: string;
  body: string;
  messageId?: string;
  date?: string;
}

export interface Classification {
  type: "job_application" | "travel" | "receipt" | "revenue" | "other";
  confidence: number;
  reasoning?: string;
  actions: Action[];
  method?: string;
}

export interface Action {
  type: "simple" | "complex";
  label: string;
  handler: string;
  data: Record<string, any>;
}

export interface ClassificationPattern {
  patterns: RegExp[];
  confidence: number;
  type: Classification["type"];
}

export interface ClassificationConfig {
  openai: {
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  patterns: {
    exclusions: RegExp[];
    jobApplication: RegExp[];
    travel: RegExp[];
    receipt: RegExp[];
    revenue: RegExp[];
  };
}
