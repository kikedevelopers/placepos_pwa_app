<script lang="ts">
    import FormField from '$lib/components/FormField.svelte'
    import type { CustomerFormData } from '../schemas/customer.schema'
    import PersonTypeToggle from './PersonTypeToggle.svelte'

    interface Props {
        form: CustomerFormData
        errors: Record<string, string>
    }
    let { form, errors }: Props = $props()

    const isCompany = $derived(form.person_type === 'COMPANY')
</script>

<div class="flex flex-col gap-4">
    <PersonTypeToggle value={form.person_type} onChange={(t) => (form.person_type = t)} />

    <FormField
        bind:value={form.name}
        label={isCompany ? 'Nombre de la empresa' : 'Nombre'}
        placeholder={isCompany ? 'Razón social' : 'Nombre completo'}
        error={errors['name']}
        autocapitalize="sentences"
        maxlength={200}
    />
    <FormField
        bind:value={form.doc_number}
        label={isCompany ? 'NIT' : 'Documento de identidad'}
        placeholder={isCompany ? 'NIT de la empresa' : 'Cédula / documento'}
        error={errors['doc_number']}
        autocapitalize="none"
        maxlength={30}
    />
    <FormField
        bind:value={form.phone}
        label="Teléfono"
        placeholder="Número de contacto"
        error={errors['phone']}
        inputmode="numeric"
        autocapitalize="none"
        maxlength={30}
    />
    <FormField
        bind:value={form.email}
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        error={errors['email']}
        autocapitalize="none"
        maxlength={255}
    />
    <FormField
        bind:value={form.address}
        label="Dirección"
        placeholder="Dirección del cliente"
        error={errors['address']}
        maxlength={500}
        multiline
    />
</div>
