export interface TemplateWhatsApp {
  tipo: string;
  nome: string;
  template_markdown: string;
  placeholders: string[];
  total_placeholders: number;
  criado_em?: string;
  modificado_em?: string;
}

export interface ApiResponse<T = unknown> {
  status: 'OK' | 'ERROR';
  message: string;
  code?: string;
  data?: T;
}
