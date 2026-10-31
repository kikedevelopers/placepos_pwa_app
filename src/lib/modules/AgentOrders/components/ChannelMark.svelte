<script lang="ts">
    import { MessageCircle, Send } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import { isWhatsappChannel } from '../utils/agentOrders'

    /** Marca del canal (WhatsApp / Telegram) en un círculo con su color. */
    interface Props {
        channel: string
        class?: string
    }
    let { channel, class: className = '' }: Props = $props()
    const whatsapp = $derived(isWhatsappChannel(channel))
    const Icon = $derived(whatsapp ? MessageCircle : Send)
</script>

<span
    aria-hidden="true"
    class={cn(
        'flex h-4 w-4 items-center justify-center rounded-full text-white',
        whatsapp ? 'bg-[#25D366]' : 'bg-[#229ED9]',
        className
    )}
>
    <Icon size={10} strokeWidth={2.6} />
</span>
