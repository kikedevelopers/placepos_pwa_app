<script lang="ts">
    import { untrack } from 'svelte'
    import { Save } from '@lucide/svelte'
    import type { Company } from '$lib/api/requests/company'
    import { getErrorMessage } from '$lib/utils/errors'
    import FormField from '$lib/components/FormField.svelte'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import StatusBanner from '$lib/components/StatusBanner.svelte'
    import { companySchema, type CompanyFormData } from '../schemas/business'
    import { useUpdateCompany } from '../hooks/useCompanySettings'

    let { company }: { company: Company } = $props()

    const update = useUpdateCompany()

    const seed = (c: Company): CompanyFormData => ({
        name: c.name ?? '',
        document_number: c.document_number ?? '',
        email: c.email ?? '',
        phone_number: c.phone_number ?? '',
        address: c.address ?? ''
    })

    let form = $state<CompanyFormData>(untrack(() => seed(company)))
    let seededId = $state(untrack(() => company.id))
    let attempted = $state(false)
    let submitError = $state('')
    let saved = $state(false)

    // Resincroniza si cambia la company (p.ej. switch de sucursal).
    $effect(() => {
        if (company.id !== seededId) {
            form = seed(company)
            seededId = company.id
        }
    })

    const buildErrors = (issues: { path: (string | number)[]; message: string }[]) => {
        const map: Record<string, string> = {}
        for (const issue of issues) {
            const key = issue.path.join('.')
            if (!(key in map)) map[key] = issue.message
        }
        return map
    }

    const validation = $derived(companySchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error.issues) : {})
    const dirty = $derived(
        form.name.trim() !== (company.name ?? '') ||
            form.document_number.trim() !== (company.document_number ?? '') ||
            form.email.trim() !== (company.email ?? '') ||
            form.phone_number.trim() !== (company.phone_number ?? '') ||
            form.address.trim() !== (company.address ?? '')
    )

    const touch = () => ((submitError = ''), (saved = false))

    const submit = () => {
        attempted = true
        touch()
        if (!validation.success) return
        const d = validation.data
        $update.mutate(
            {
                companyId: company.id,
                payload: {
                    name: d.name,
                    document_number: d.document_number,
                    email: d.email,
                    phone_number: d.phone_number,
                    address: d.address
                }
            },
            {
                onSuccess: () => {
                    saved = true
                    attempted = false
                },
                onError: (e) =>
                    (submitError = getErrorMessage(e) ?? 'No se pudo guardar la información.')
            }
        )
    }
</script>

<div class="flex flex-col gap-4">
    <FormField
        bind:value={form.name}
        label="Nombre del negocio *"
        placeholder="Ej: Mi Negocio S.A.S"
        error={errors['name']}
        maxlength={150}
        oninput={touch}
    />
    <FormField
        bind:value={form.document_number}
        label="Número de documento"
        placeholder="Ej: 900123456-7"
        error={errors['document_number']}
        inputmode="text"
        autocapitalize="none"
        maxlength={50}
        oninput={touch}
    />
    <FormField
        bind:value={form.email}
        label="Correo electrónico"
        placeholder="Ej: contacto@minegocio.com"
        error={errors['email']}
        inputmode="text"
        autocapitalize="none"
        maxlength={255}
        oninput={touch}
    />
    <FormField
        bind:value={form.phone_number}
        label="Número de teléfono"
        placeholder="Ej: +57 300 1234567"
        error={errors['phone_number']}
        inputmode="text"
        maxlength={50}
        oninput={touch}
    />
    <FormField
        bind:value={form.address}
        label="Dirección"
        placeholder="Ej: Calle 123 #45-67"
        error={errors['address']}
        maxlength={200}
        oninput={touch}
    />

    {#if submitError}
        <StatusBanner kind="error" message={submitError} />
    {:else if saved}
        <StatusBanner kind="success" message="Información guardada" />
    {/if}

    <PrimaryButton
        label="Guardar cambios"
        icon={Save}
        loading={$update.isPending}
        disabled={!dirty}
        onclick={submit}
    />
</div>
