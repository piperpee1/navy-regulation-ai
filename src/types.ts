export interface User {
  user_id: string;
  name: string;
  rank: string;
  unit: string;
  militaryId?: string;
  password?: string;
  profileImage?: string;
}

export interface Regulation {
  regulation_id: string;
  title: string;
  category: string;
  pdf_path: string;
  upload_date: string;
  summary: string;
  aiSummary?: string;
}

export interface SavedDocument {
  doc_id: string;
  user_id: string;
  doc_type: string;
  title: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  chat_id: string;
  question: string;
  answer: string;
  reference?: string;
  isLoading?: boolean;
}
