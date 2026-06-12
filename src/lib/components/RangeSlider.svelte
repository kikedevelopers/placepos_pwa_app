<script lang="ts">
    /** Slider (range) premium con relleno primary. value vía callback. */
    interface Props {
        value: number
        onValueChange: (value: number) => void
        min?: number
        max?: number
        step?: number
        ariaLabel?: string
    }
    let { value, onValueChange, min = 1, max = 30, step = 1, ariaLabel }: Props = $props()

    const pct = $derived(((value - min) / (max - min)) * 100)
</script>

<input
    type="range"
    {min}
    {max}
    {step}
    {value}
    aria-label={ariaLabel}
    oninput={(e) => onValueChange(Number((e.currentTarget as HTMLInputElement).value))}
    class="slider h-1.5 w-full cursor-pointer appearance-none rounded-full"
    style="background:linear-gradient(to right, hsl(217,91%,50%) {pct}%, hsl(214,32%,89%) {pct}%)"
/>

<style>
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        height: 22px;
        width: 22px;
        border-radius: 9999px;
        background: #fff;
        border: 2px solid hsl(217, 91%, 50%);
        box-shadow: 0 2px 6px hsla(217, 91%, 50%, 0.35);
        cursor: pointer;
    }
    .slider::-moz-range-thumb {
        height: 22px;
        width: 22px;
        border-radius: 9999px;
        background: #fff;
        border: 2px solid hsl(217, 91%, 50%);
        box-shadow: 0 2px 6px hsla(217, 91%, 50%, 0.35);
        cursor: pointer;
    }
</style>
