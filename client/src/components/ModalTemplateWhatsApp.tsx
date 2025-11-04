import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TemplateWhatsApp } from "@/types/template-whatsapp";

interface ModalTemplateWhatsAppProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { nome: string; template_markdown: string }) => void;
  template?: TemplateWhatsApp | null;
  isLoading?: boolean;
}

export default function ModalTemplateWhatsApp({
  open,
  onOpenChange,
  onSave,
  template,
  isLoading = false,
}: ModalTemplateWhatsAppProps) {
  const [nome, setNome] = useState("");
  const [templateMarkdown, setTemplateMarkdown] = useState("");
  const [abaAtual, setAbaAtual] = useState("editor");

  useEffect(() => {
    if (open) {
      if (template) {
        setNome(template.nome);
        setTemplateMarkdown(template.template_markdown);
      } else {
        setNome("");
        setTemplateMarkdown("");
      }
      setAbaAtual("editor");
    }
  }, [open, template]);

  const extractPlaceholders = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const placeholders = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      placeholders.add(match[1]);
    }
    return Array.from(placeholders);
  };

  const placeholders = extractPlaceholders(templateMarkdown);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nome, template_markdown: templateMarkdown });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {template ? "Editar Template" : "Novo Template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Edite o nome e o conteúdo do template WhatsApp."
              : "Crie um novo template WhatsApp. Use {{placeholder}} para campos dinâmicos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Template</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Boas Vindas"
              required
              data-testid="input-nome"
            />
            <p className="text-xs text-muted-foreground">
              O tipo será gerado automaticamente a partir do nome
            </p>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo do Template</Label>
            <Tabs value={abaAtual} onValueChange={setAbaAtual}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" data-testid="tab-editor">
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview">
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-2">
                <Textarea
                  value={templateMarkdown}
                  onChange={(e) => setTemplateMarkdown(e.target.value)}
                  placeholder="Digite o conteúdo do template... Use {{nome}}, {{valor}}, etc."
                  className="min-h-[300px] font-mono text-sm"
                  required
                  data-testid="textarea-template"
                />
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Dica:</strong> Use a sintaxe <code>{"{{nome_campo}}"}</code> para criar campos dinâmicos.
                    Suporta Markdown e emojis.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="preview" className="space-y-2">
                <div
                  className="min-h-[300px] border rounded-md p-4 bg-muted/30"
                  data-testid="preview-container"
                >
                  {templateMarkdown ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {templateMarkdown}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      O preview aparecerá aqui...
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {placeholders.length > 0 && (
            <div className="space-y-2">
              <Label>Placeholders Detectados ({placeholders.length})</Label>
              <div className="flex flex-wrap gap-2" data-testid="placeholders-container">
                {placeholders.map((placeholder) => (
                  <Badge
                    key={placeholder}
                    variant="secondary"
                    data-testid={`badge-placeholder-${placeholder}`}
                  >
                    {`{{${placeholder}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-salvar">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {template ? "Atualizar" : "Criar Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
