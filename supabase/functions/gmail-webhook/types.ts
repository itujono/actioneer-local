export interface EmailContent {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  attachments: Attachment[];
}

export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  hasData: boolean;
  downloadUrl: string | null;
}

export interface JobData {
  company: string;
  position: string;
  status: string;
  appliedDate: string | null;
  confidence: number;
  countryCode: string | null;
  website: string;
  details: Record<string, any>;
}

export interface ReceiptData {
  vendor: string;
  amount: number | null;
  currency: string;
  receiptDate: string;
  category: string;
  description: string;
  receiptType: string;
  invoiceNumber: string | null;
  confidence: number;
}

export interface ClassificationResult {
  type: string;
  confidence: number;
  method?: string;
}

export interface ProcessingResult {
  success: boolean;
  processedCount?: number;
  jobApplicationsFound?: number;
  receiptsFound?: number;
  revenueFound?: number;
  method?: string;
  error?: string;
  requiresReauth?: boolean;
  instructions?: string;
}
