<!--
 Backdrop premium del Login: gradiente base claro + sheen azul diagonal y tres
 orbes `primary` de muy baja opacidad que simulan un mesh-gradient. El glow vive
 en azul porque el `--primary` del tema es azul (hsl 217 91% 50%). En web el blur
 es barato, así que los orbes van difuminados para un degradado más suave.
-->
<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div
        class="absolute inset-0"
        style="background:linear-gradient(to bottom right, hsl(210 45% 98%) 0%, hsl(0 0% 100%) 55%, hsl(214 48% 97%) 100%)"
    ></div>
    <div
        class="absolute inset-0"
        style="background:linear-gradient(135deg, hsla(217,91%,50%,0.07) 0%, transparent 50%, hsla(213,94%,55%,0.06) 100%)"
    ></div>

    <div
        class="absolute rounded-full"
        style="width:420px;height:420px;top:-100px;left:-80px;background:hsla(217,91%,50%,0.10);filter:blur(48px)"
    ></div>
    <div
        class="absolute rounded-full"
        style="width:280px;height:280px;top:5%;right:-90px;background:hsla(213,94%,58%,0.09);filter:blur(48px)"
    ></div>
    <div
        class="absolute rounded-full"
        style="width:340px;height:340px;bottom:3%;left:16%;background:hsla(217,91%,50%,0.06);filter:blur(48px)"
    ></div>
</div>
