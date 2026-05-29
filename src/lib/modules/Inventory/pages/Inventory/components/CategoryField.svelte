<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors'
    import AutocompleteField from '$lib/components/AutocompleteField.svelte'
    import { useCategories, useCreateCategory } from '../hooks/useCatalogs'

    interface Props {
        value: number | null
        onSelect: (id: number | null) => void
    }
    let { value, onSelect }: Props = $props()

    const query = useCategories()
    const createMut = useCreateCategory()
    let error = $state('')

    const options = $derived(
        ($query.data ?? []).filter((c) => !c.is_archived).map((c) => ({ id: c.id, label: c.name }))
    )

    const handleCreate = (name: string) => {
        error = ''
        $createMut.mutate(name, {
            onSuccess: (category) => onSelect(category.id),
            onError: (e) => (error = getErrorMessage(e) ?? 'No se pudo crear la categoría.')
        })
    }
</script>

<AutocompleteField
    label="Categoría"
    placeholder="Buscar o crear categoría"
    {value}
    {options}
    {onSelect}
    create={{ pending: $createMut.isPending, error, onCreate: handleCreate }}
/>
