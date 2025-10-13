import AppSidebar from '../AppSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          isAdmin={true} 
          userName="João Silva" 
          userEmail="joao@exemplo.com" 
        />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold">Conteúdo Principal</h1>
        </div>
      </div>
    </SidebarProvider>
  )
}
