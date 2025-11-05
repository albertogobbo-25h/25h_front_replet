import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminPlanos() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Gerenciar Planos
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure e gerencie os planos de assinatura do sistema
            </p>
          </div>
          <Button data-testid="button-novo-plano">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card data-testid="card-plano-free">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Plano de degustação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">R$ 0,00</div>
                <p className="text-sm text-muted-foreground">por mês</p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Recursos inclusos:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Acesso limitado</li>
                  <li>Período de degustação</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full" disabled data-testid="button-editar-plano-free">
                Editar
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="card-empty-state">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                Funcionalidade em desenvolvimento.<br />
                Em breve você poderá criar e gerenciar planos personalizados.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
