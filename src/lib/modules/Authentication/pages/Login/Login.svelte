<script lang="ts">
    import { AlertCircle, Lock, User } from '@lucide/svelte'
    import AuroraBackground from './components/AuroraBackground.svelte'
    import AuthField from './components/AuthField.svelte'
    import BrandMark from './components/BrandMark.svelte'
    import StaggerFadeIn from './components/StaggerFadeIn.svelte'
    import SubmitButton from './components/SubmitButton.svelte'
    import { useLoginForm } from './hooks/useLoginForm.svelte'

    const { form, errors, loginError, mutation, clearError, onSubmit } = useLoginForm()

    const userInvalid = $derived(!!errors.username || loginError.type === 'user')
    const passwordInvalid = $derived(!!errors.password || loginError.type === 'password')
    const hasBanner = $derived(!!loginError.message)
</script>

<div class="relative min-h-[100dvh] bg-background">
    <AuroraBackground />

    <div
        class="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12 pt-[calc(env(safe-area-inset-top)+48px)]"
    >
        <form class="w-full max-w-sm" onsubmit={onSubmit}>
            <StaggerFadeIn index={0} class="mb-8">
                <BrandMark />
            </StaggerFadeIn>

            <div
                class="overflow-hidden rounded-3xl border p-6 backdrop-blur-xl"
                style="border-color:hsla(0,0%,100%,0.7);background-color:hsla(0,0%,100%,0.5);box-shadow:0 16px 30px hsla(222,47%,11%,0.08)"
            >
                <div
                    class="pointer-events-none absolute inset-x-0 top-0 h-14"
                    style="background:linear-gradient(to bottom, hsla(0,0%,100%,0.6), hsla(0,0%,100%,0))"
                ></div>

                <div class="flex flex-col gap-5">
                    <StaggerFadeIn index={1}>
                        <AuthField
                            bind:value={form.username}
                            label="Usuario"
                            placeholder="Correo o nombre de usuario"
                            icon={User}
                            invalid={userInvalid}
                            errorMessage={errors.username}
                            autocomplete="username"
                            oninteract={clearError}
                        />
                    </StaggerFadeIn>

                    <StaggerFadeIn index={2}>
                        <AuthField
                            bind:value={form.password}
                            label="Contraseña"
                            placeholder="••••••••"
                            icon={Lock}
                            secure
                            invalid={passwordInvalid}
                            errorMessage={errors.password}
                            autocomplete="current-password"
                            oninteract={clearError}
                        />
                    </StaggerFadeIn>

                    {#if hasBanner}
                        <StaggerFadeIn index={3}>
                            <div
                                class="flex items-start gap-2 rounded-xl px-3 py-2.5"
                                style="background-color:hsla(0,84%,55%,0.10);border:1px solid hsla(0,84%,55%,0.30)"
                            >
                                <AlertCircle size={15} color="hsl(0, 84%, 55%)" />
                                <span class="flex-1 text-xs leading-4 text-destructive"
                                    >{loginError.message}</span
                                >
                            </div>
                        </StaggerFadeIn>
                    {/if}

                    <StaggerFadeIn index={hasBanner ? 4 : 3} class="mt-1">
                        <SubmitButton
                            loading={$mutation.isPending}
                            label="Ingresar"
                            loadingLabel="Ingresando..."
                            onclick={onSubmit}
                        />
                    </StaggerFadeIn>
                </div>
            </div>

            <StaggerFadeIn index={hasBanner ? 5 : 4}>
                <p class="mt-7 text-center text-xs tracking-[0.2px] text-muted-foreground/60">
                    Sistema de Punto de Venta Informativo
                </p>
            </StaggerFadeIn>
        </form>
    </div>
</div>
