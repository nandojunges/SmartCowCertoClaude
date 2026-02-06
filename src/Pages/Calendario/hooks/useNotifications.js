// src/Pages/Calendario/hooks/useNotifications.js

/**
 * Hook fake de notificações
 * Usado APENAS para layout / estrutura.
 * Não faz nada de verdade.
 */
export function useNotifications() {
  return {
    notificacoes: [],
    permissao: "default",
    solicitarPermissao: async () => false,
    agendarNotificacao: () => null,
    cancelarNotificacao: () => {},
    notificarTarefa: () => null,
  };
}
