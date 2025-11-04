import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import TemplatesWhatsAppTable from "@/components/TemplatesWhatsAppTable";
import ModalTemplateWhatsApp from "@/components/ModalTemplateWhatsApp";
import type { TemplateWhatsApp, ApiResponse } from "@/types/template-whatsapp";

export default function TemplatesWhatsAppPage() {
  const { toast } = useToast();
  const [modalTemplate, setModalTemplate] = useState(false);
  const [templateParaEditar, setTemplateParaEditar] = useState<TemplateWhatsApp | null>(null);
  const [templateParaExcluir, setTemplateParaExcluir] = useState<TemplateWhatsApp | null>(null);
  const [modalExcluir, setModalExcluir] = useState(false);

  const { data: templatesData, isLoading, error: queryError } = useQuery<TemplateWhatsApp[]>({
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
      
      if (response.status === 'OK') {
        toast({
          variant: "destructive",
          title: "Formato de resposta inesperado",
          description: "O backend retornou dados em formato não reconhecido.",
        });
      }

      return [];
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (payload: { nome: string; template_markdown: string }) => {
      const { data, error } = await supabase.rpc('criar_template_whatsapp', {
        p_nome: payload.nome,
        p_template_markdown: payload.template_markdown,
      });

      if (error) throw error;
      
      const response = data as ApiResponse<TemplateWhatsApp>;
      
      if (!response || response.status === 'ERROR') {
        throw new Error(response?.message || 'Erro ao criar template');
      }

      return response;
    },
    onSuccess: (response) => {
      toast({
        title: "Template criado",
        description: response.message || "O template foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates-whatsapp'] });
      setModalTemplate(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar template",
        description: error.message,
      });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async (payload: { tipo: string; nome: string; template_markdown: string }) => {
      const { data, error } = await supabase.rpc('atualizar_template_whatsapp', {
        p_tipo: payload.tipo,
        p_nome: payload.nome,
        p_template_markdown: payload.template_markdown,
      });

      if (error) throw error;
      
      const response = data as ApiResponse<TemplateWhatsApp>;
      
      if (!response || response.status === 'ERROR') {
        throw new Error(response?.message || 'Erro ao atualizar template');
      }

      return response;
    },
    onSuccess: (response) => {
      toast({
        title: "Template atualizado",
        description: response.message || "O template foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates-whatsapp'] });
      setModalTemplate(false);
      setTemplateParaEditar(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar template",
        description: error.message,
      });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: async (tipo: string) => {
      const { data, error } = await supabase.rpc('excluir_template_whatsapp', {
        p_tipo: tipo,
      });

      if (error) throw error;
      
      const response = data as ApiResponse<void>;
      
      if (!response || response.status === 'ERROR') {
        throw new Error(response?.message || 'Erro ao excluir template');
      }

      return response;
    },
    onSuccess: (response) => {
      toast({
        title: "Template excluído",
        description: response.message || "O template foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates-whatsapp'] });
      setModalExcluir(false);
      setTemplateParaExcluir(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir template",
        description: error.message,
      });
    },
  });

  const handleNovoTemplate = () => {
    setTemplateParaEditar(null);
    setModalTemplate(true);
  };

  const handleEditarTemplate = (template: TemplateWhatsApp) => {
    setTemplateParaEditar(template);
    setModalTemplate(true);
  };

  const handleExcluirTemplate = (template: TemplateWhatsApp) => {
    setTemplateParaExcluir(template);
    setModalExcluir(true);
  };

  const handleSalvarTemplate = (data: { nome: string; template_markdown: string }) => {
    if (templateParaEditar) {
      atualizarMutation.mutate({
        tipo: templateParaEditar.tipo,
        nome: data.nome,
        template_markdown: data.template_markdown,
      });
    } else {
      criarMutation.mutate(data);
    }
  };

  const handleConfirmarExclusao = () => {
    if (templateParaExcluir) {
      excluirMutation.mutate(templateParaExcluir.tipo);
    }
  };

  const templates = templatesData || [];
  const totalTemplates = templates.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Templates WhatsApp</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus templates de mensagens WhatsApp
          </p>
        </div>
        <Button onClick={handleNovoTemplate} data-testid="button-novo-template">
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Total de Templates</CardTitle>
              <CardDescription className="text-xs">
                Templates personalizados criados
              </CardDescription>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-templates">
              {totalTemplates}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Templates</CardTitle>
          <CardDescription>
            Lista de todos os templates WhatsApp personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : queryError ? (
            <div className="text-center py-12">
              <p className="text-destructive font-medium mb-2">Erro ao carregar templates</p>
              <p className="text-sm text-muted-foreground">{(queryError as Error).message}</p>
            </div>
          ) : (
            <TemplatesWhatsAppTable
              templates={templates}
              onEdit={handleEditarTemplate}
              onDelete={handleExcluirTemplate}
            />
          )}
        </CardContent>
      </Card>

      <ModalTemplateWhatsApp
        open={modalTemplate}
        onOpenChange={setModalTemplate}
        onSave={handleSalvarTemplate}
        template={templateParaEditar}
        isLoading={criarMutation.isPending || atualizarMutation.isPending}
      />

      <AlertDialog open={modalExcluir} onOpenChange={setModalExcluir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-confirm-title">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirMutation.isPending} data-testid="button-cancelar-exclusao">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              disabled={excluirMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-exclusao"
            >
              {excluirMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
