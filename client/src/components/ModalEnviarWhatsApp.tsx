import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TemplateWhatsApp, ApiResponse } from "@/types/template-whatsapp";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { callSupabase, extractFriendlyErrorMessage, ERROR_MESSAGES } from "@/lib/api-helper";
import { useAuth } from "@/contexts/AuthContext";

interface ModalEnviarWhatsAppProps {
  open: boolean;
  onClose: () => void;
  destinatario: {
    nome: string;
    whatsapp: string;
  };
  dadosCobranca?: Record<string, any>;
  contexto?: string;
}

export default function ModalEnviarWhatsApp({
  open,
  onClose,
  destinatario,
  dadosCobranca = {},
  contexto = 'saas'
}: ModalEnviarWhatsAppProps) {
  const { toast } = useToast();
  const { assinanteId } = useAuth();
  const [templateSelecionado, setTemplateSelecionado] = useState<string>("");
  const [previewMessage, setPreviewMessage] = useState<string>("");

  const { data: templates, isLoading: loadingTemplates } = useQuery<TemplateWhatsApp[]>({
    queryKey: ['/api/templates-whatsapp'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_templates_whatsapp');

      if (error) throw error;
      
      if (!data) return [];
      
      if (Array.isArray(data)) {
        return data as TemplateWhatsApp[];
      }
      
      const response = data as ApiResponse<TemplateWhatsApp[] | { templates: TemplateWhatsApp[] }>;
      
      if (response.status === 'ERROR') {
        throw new Error(response.message || 'Erro ao listar templates');
      }
      
      if (response.status === 'OK' && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        
        if (typeof response.data === 'object' && 'templates' in response.data && Array.isArray(response.data.templates)) {
          return response.data.templates;
        }
      }

      return [];
    },
  });

  const enviarMutation = useMutation({
    mutationFn: async () => {
      if (!templateSelecionado) {
        throw new Error('Selecione um template');
      }

      // Normalizar número WhatsApp (remover formatação, deixar apenas números)
      const whatsNormalizado = destinatario.whatsapp.replace(/\D/g, '');

      // Construir payload base
      const payload: any = {
        contexto,
        tipo: templateSelecionado,
        whats: whatsNormalizado,
        data: {
          nome: destinatario.nome,
          ...dadosCobranca,
        }
      };

      // Adicionar assinante_id se contexto for "assinante"
      if (contexto === 'assinante') {
        if (!assinanteId) {
          throw new Error('ID do assinante não encontrado. Faça login novamente.');
        }
        payload.assinante_id = assinanteId;
      }

      const result = await callSupabase<{
        template_usado: string;
        tipo: string;
        destinatario: string;
        instancia: string;
        tempo_processamento_ms: number;
      }>(
        () => supabase.functions.invoke('enviar-mensagem-whatsapp', {
          body: payload
        }),
        'enviar-mensagem-whatsapp'
      );

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: `A mensagem foi enviada para ${destinatario.nome} via WhatsApp.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: extractFriendlyErrorMessage(error, 'Não foi possível enviar a mensagem. Tente novamente.'),
      });
    },
  });

  const handleEnviar = () => {
    enviarMutation.mutate();
  };

  // Atualizar preview quando template for selecionado
  useEffect(() => {
    if (!templateSelecionado || !templates) {
      setPreviewMessage("");
      return;
    }

    const template = templates.find(t => t.tipo === templateSelecionado);
    if (!template) {
      setPreviewMessage("");
      return;
    }

    // Substituir placeholders com dados disponíveis
    let mensagem = template.template_markdown;
    
    // Dados disponíveis para substituição
    const dados = {
      nome: destinatario.nome,
      ...dadosCobranca,
    };

    // Substituir cada placeholder (formato: {{campo}})
    Object.entries(dados).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      mensagem = mensagem.replace(placeholder, String(value || ''));
    });

    setPreviewMessage(mensagem);
  }, [templateSelecionado, templates, destinatario, dadosCobranca]);

  const templateAtual = templates?.find(t => t.tipo === templateSelecionado);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-enviar-whatsapp">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem WhatsApp
          </DialogTitle>
          <DialogDescription>
            Selecione um template e envie mensagem para {destinatario.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select
              value={templateSelecionado}
              onValueChange={setTemplateSelecionado}
              disabled={loadingTemplates}
            >
              <SelectTrigger id="template" data-testid="select-template">
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <SelectItem key={template.tipo} value={template.tipo} data-testid={`select-item-${template.tipo}`}>
                      {template.nome}
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum template disponível
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {templateAtual && (
            <>
              <div className="space-y-2">
                <Label>Placeholders</Label>
                <div className="flex flex-wrap gap-2">
                  {templateAtual.placeholders.map((placeholder) => (
                    <Badge key={placeholder} variant="outline" data-testid={`badge-placeholder-${placeholder}`}>
                      {placeholder}
                    </Badge>
                  ))}
                  {templateAtual.placeholders.length === 0 && (
                    <span className="text-sm text-muted-foreground">Nenhum placeholder neste template</span>
                  )}
                </div>
              </div>

              {previewMessage && (
                <div className="space-y-2">
                  <Label>Preview da Mensagem</Label>
                  <div
                    className="border rounded-md p-4 bg-muted/50 prose prose-sm dark:prose-invert max-w-none"
                    data-testid="preview-message"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {previewMessage}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Destinatário</Label>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{destinatario.nome}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{destinatario.whatsapp}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={enviarMutation.isPending}
            data-testid="button-cancelar"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={!templateSelecionado || enviarMutation.isPending}
            data-testid="button-enviar"
          >
            {enviarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
