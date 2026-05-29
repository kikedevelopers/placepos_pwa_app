<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors'
    import AutocompleteField from '$lib/components/AutocompleteField.svelte'
    import { usePackagings, useCreatePackaging } from '../hooks/useCatalogs'

    interface Props {
        value: number | null
        onSelect: (id: number | null) => void
    }
    let { value, onSelect }: Props = $props()

    const query = usePackagings()
    const createMut = useCreatePackaging()
    let error = $state('')

    const options = $derived(
        ($query.data ?? [])
            .filter((p) => !p.is_archived)
            .map((p) => ({ id: p.id, label: `${p.name} (${p.value})` }))
    )

    const handleCreate = (name: string, extra: number | null) => {
        error = ''
        $createMut.mutate(
            { name, value: extra ?? 1 },
            {
                onSuccess: (packaging) => onSelect(packaging.id),
                onError: (e) => (error = getErrorMessage(e) ?? 'No se pudo crear el empaque.')
            }
        )
    }
</script>

<AutocompleteField
    label="Empaque / Presentación"
    placeholder="Buscar o crear empaque"
    {value}
    {options}
    {onSelect}
    create={{
        pending: $createMut.isPending,
        error,
        extra: { placeholder: 'Unidades (ej. 12)' },
        onCreate: handleCreate
    }}
/>
