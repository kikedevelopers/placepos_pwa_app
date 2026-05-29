<script lang="ts">
    import FilterChips from '$lib/components/FilterChips.svelte'
    import { RANGE_PRESET_OPTIONS, type RangePreset } from './dateRange'

    interface Props {
        value: RangePreset
        onChange: (preset: RangePreset) => void
    }
    let { value, onChange }: Props = $props()
</script>

<FilterChips
    options={RANGE_PRESET_OPTIONS}
    {value}
    onChange={(v) => onChange(v as RangePreset)}
/>
