<script lang="ts">
    import { Loader2 } from '@lucide/svelte'
    import { z } from 'zod'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import FormField from '$lib/components/FormField.svelte'
    import { useCreateBranch } from '$lib/hooks/useBranchMutations'

    interface Props {
        open: boolean
        onClose: () => void
    }
    let { open, onClose }: Props = $props()

    const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

    const schema = z.object({
        company_name: z.string().trim().min(1, 'El nombre es obligatorio'),
        document_number: z.string().trim().optional(),
        address: z.string().trim().optional(),
        email: z
            .string()
            .trim()
            .optional()
            .refine((v) => !v || EMAIL_RE.test(v), { message: 'El correo no es válido' }),
        phone_number: z.string().trim().optional()
    })

    const empty = () => ({
        company_name: '',
        document_number: '',
        address: '',
        email: '',
        phone_number: ''
    })

    const create = useCreateBranch()

    let form = $state(empty())
    let attempted = $state(false)
    let submitError = $state('')

    const validation = $derived(schema.safeParse($state.snapshot(form)))
    const errors = $derived.by(() => {
        if (!attempted || validation.success) return {} as Record<string, string>
        const out: Record<string, string> = {}
        for (const issue of validation.error.issues) {
            const key = String(issue.path[0] ?? '')
            if (key && !out[key]) out[key] = issue.message
        }
        return out
    })

    const close = () => {
        if ($create.isPending) return
        form = empty()
        attempted = false
        submitError = ''
        onClose()
    }

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return

        $create.mutate(
            {
                company_name: form.company_name.trim(),
                document_number: form.document_number.trim() || undefined,
                address: form.address.trim() || undefined,
                email: form.email.trim() || undefined,
                phone_number: form.phone_number.trim() || undefined
            },
            {
                onSuccess: () => {
                    form = empty()
                    attempted = false
                    onClose()
                },
                onError: (error: unknown) => {
                    const err = error as { error?: string; message?: string }
                    submitError = err?.error ?? err?.message ?? 'No se pudo crear la sucursal'
                }
            }
        )
    }
</script>

<BottomSheet {open} title="Nueva sucursal" onClose={close}>
    <div class="flex flex-col gap-4 pb-2">
        <p class="text-[13px] text-muted-foreground">
            Se creará como un negocio independiente con su propia información. Podrás cambiar entre
            sucursales desde el selector.
        </p>

        <FormField
            bind:value={form.company_name}
            label="Nombre del negocio"
            placeholder="Ej: Sucursal Centro"
            error={errors['company_name']}
        />
        <FormField
            bind:value={form.document_number}
            label="Documento"
            placeholder="Ej: 900123456-7"
        />
        <FormField
            bind:value={form.email}
            label="Correo"
            placeholder="Ej: sucursal@negocio.com"
            error={errors['email']}
        />
        <FormField
            bind:value={form.phone_number}
            label="Teléfono"
            placeholder="Ej: +57 300 1234567"
        />
        <FormField bind:value={form.address} label="Dirección" placeholder="Ej: Calle 123 #45-67" />

        {#if submitError}
            <p class="text-xs text-destructive">{submitError}</p>
        {/if}
    </div>

    {#snippet footer()}
        <button
            type="button"
            onclick={submit}
            disabled={$create.isPending}
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
        >
            {#if $create.isPending}
                <Loader2 size={16} class="animate-spin" />
            {/if}
            Crear sucursal
        </button>
    {/snippet}
</BottomSheet>
