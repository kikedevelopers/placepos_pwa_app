import type { ChatMessage } from '../store/chat.svelte'

/**
 * "Reintentar" solo tiene sentido en la ÚLTIMA respuesta de Place, cuando ya
 * terminó y FALLÓ (la respuesta o el envío de la pregunta). Una respuesta
 * exitosa se copia, no se regenera.
 */
export const canRetryReply = (
    message: Pick<ChatMessage, 'id' | 'role' | 'is_error'>,
    { isStreaming, lastAssistantId }: { isStreaming: boolean; lastAssistantId?: string }
): boolean =>
    !isStreaming &&
    message.role === 'assistant' &&
    message.id === lastAssistantId &&
    message.is_error === true
