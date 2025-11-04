import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/masks";
import type { TemplateWhatsApp } from "@/types/template-whatsapp";

interface TemplatesWhatsAppTableProps {
  templates: TemplateWhatsApp[];
  onEdit: (template: TemplateWhatsApp) => void;
  onDelete: (template: TemplateWhatsApp) => void;
}

export default function TemplatesWhatsAppTable({
  templates,
  onEdit,
  onDelete,
}: TemplatesWhatsAppTableProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum template encontrado. Crie seu primeiro template para começar.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Placeholders</TableHead>
            <TableHead>Modificado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.tipo} data-testid={`row-template-${template.tipo}`}>
              <TableCell className="font-medium" data-testid={`text-nome-${template.tipo}`}>
                {template.nome}
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded" data-testid={`text-tipo-${template.tipo}`}>
                  {template.tipo}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {template.placeholders.length > 0 ? (
                    template.placeholders.map((placeholder) => (
                      <Badge
                        key={placeholder}
                        variant="secondary"
                        className="text-xs"
                        data-testid={`badge-placeholder-${placeholder}`}
                      >
                        {`{{${placeholder}}}`}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhum</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {template.modificado_em ? formatDate(template.modificado_em) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(template)}
                    data-testid={`button-editar-${template.tipo}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(template)}
                    data-testid={`button-excluir-${template.tipo}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
