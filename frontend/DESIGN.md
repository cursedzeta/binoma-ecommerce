# Sistema de diseño de BINOMA

Especificación del sistema visual de la tienda. Si vas a tocar una pantalla,
leé esto antes.

## La regla

**Ningún componente escribe un color, una fuente ni un radio sueltos.** Todo
sale de los tokens de [src/index.css](src/index.css). Si algo necesita un valor
que no está ahí, se agrega ahí primero.

Se verifica así:

```bash
grep -rE "(text|bg|border)-(neutral|slate|gray|white|black)" src/
```

Tiene que devolver vacío.

## Dónde vive la configuración

Tailwind v4 se configura **en el CSS**, no en un `tailwind.config.js`. No busques
ese archivo: no existe y no debería.

```css
@theme {
  --color-marca: #ff7f00;   /* habilita bg-marca, text-marca, border-marca */
}
```

Cada token de `@theme` genera sus utilidades solo.

---

## Color

Los mismos nombres en los dos modos. El modo oscuro redefine los valores bajo
`.dark`, así que **todo el sitio cambia sin tocar un componente**.

| Token | Claro | Oscuro | Para qué |
|---|---|---|---|
| `fondo` | `#faf7f2` | `#16130f` | Fondo de la página |
| `superficie` | `#fffdfa` | `#201b16` | Tarjetas, paneles |
| `superficie-2` | `#f2ece3` | `#2a231c` | Fondos de imagen, hover, esqueletos |
| `tinta` | `#1c1917` | `#f2ede6` | Texto principal |
| `tenue` | `#6b6259` | `#a99d8e` | Texto secundario |
| `borde` | `#e7dfd4` | `#342c23` | Bordes y separadores |
| `marca` | `#ff7f00` | `#ff8a17` | Acento: botones, badges, foco |
| `marca-texto` | `#c25e00` | `#ff9b3d` | El acento **como texto** |
| `marca-suave` | `#fff0de` | `#2b1d0d` | Fondos teñidos del acento |
| `sobre-marca` | `#1c1917` | `#1c1917` | Texto **encima** del naranja |
| `sobre-hero` | `#ffffff` | `#ffffff` | Blanco, **solo** para el hero naranja |
| `exito` | `#2f6f4e` | `#6fbf90` | Estado positivo |
| `alerta` | `#8a5a12` | `#e0ab53` | Advertencias |
| `alerta-suave` | `#fdf3e2` | `#2a2213` | Fondo de advertencias |

### Las tres decisiones de contraste

Son las que más fácil se rompen sin darse cuenta.

**El texto sobre el naranja es oscuro, no blanco.** Blanco sobre `#ff7f00` da
2,3:1 y no llega a AA. Al sol se vuelve ilegible, y el teléfono se mira al sol.
Por eso existe `sobre-marca`, que vale lo mismo en los dos modos: el naranja no
cambia de claridad al cambiar el tema.

> **La excepción, y es una sola: el hero.** El titular de la portada y la barra
> de navegación mientras está apoyada sobre él usan `sobre-hero`, que es blanco
> puro. Da **2,5:1** y no llega a AA — que pide 4,5:1 para texto normal y 3:1
> para texto grande.
>
> Es una decisión de marca tomada con el número a la vista (Tomi, 18/08/2026):
> el hero es una pieza de portada, con texto muy grande y sin información que
> haga falta leer para comprar. **No se extiende**: precios, descripciones,
> formularios y estados de un pedido siguen con `sobre-marca`.
>
> Si algún día se quiere blanco legible, la salida no es cambiar el blanco sino
> oscurecer el naranja del fondo: para llegar a 4,5:1 hace falta un naranja
> bastante más oscuro que `#c25e00`, que ya da 4,1:1.

**El naranja de marca no se usa como texto sobre fondo claro.** Da 2,2:1. Para
texto está `marca-texto`, el mismo naranja oscurecido hasta pasar AA.

```jsx
<p className="text-marca">Precio</p>        {/* ✗ ilegible en claro */}
<p className="text-marca-texto">Precio</p>  {/* ✓ */}
<button className="bg-marca text-sobre-marca">Comprar</button>  {/* ✓ */}
```

**Los estados están separados de la marca.** El naranja significa BINOMA, no
"atención". Si `alerta` fuera naranja, un mensaje de error competiría
visualmente con el botón de comprar.

### Por qué estos neutros

El fondo claro es hueso cálido, no blanco puro: el blanco con el naranja da un
contraste duro, de aviso más que de mueble. El oscuro es un marrón muy oscuro,
no negro: el negro absoluto enfriaría una marca que es de madera.

---

## El hero de la Home

Fondo naranja sólido (`bg-marca`), a pantalla completa, y **se esconde detrás de
la tienda** al scrollear: el hero queda clavado en su lugar con `sticky top-0` y
el resto de la página le pasa por encima. No se arrastra hacia arriba, lo tapan.

Tres cosas lo sostienen, y si falta una el efecto no se ve:

1. El hero es `sticky top-0` con `z-0`.
2. Lo que sigue en la Home lleva **fondo propio** (`bg-fondo`) y `z-10`. Sin
   fondo, el naranja se transparentaría por detrás del contenido.
3. El hero mide `min-h-dvh`, es decir exactamente una pantalla. Quedarse clavado
   arriba solo funciona si entra: más alto que eso y se le corta lo de abajo.

**Solo de `lg` para arriba.** En mobile el contenido apilado no entra en una
pantalla, así que ahí el hero se comporta como una sección normal y se va con el
scroll.

### La barra de navegación cambia de color

Sobre el naranja: logo y textos en blanco, sin fondo ni borde. Sobre cualquier
otra cosa: los colores de siempre.

El logo blanco sale del mismo archivo SVG con `brightness-0 invert` —lo pinta de
negro y lo invierte— en vez de mantener una segunda copia blanca que después se
olvida de actualizar.

**Cómo se entera la barra.** La barra vive en el layout, por encima de todas las
rutas; el hero vive dentro de la Home. En vez de un contexto que atraviese medio
árbol, la Home marca con `data-fin-hero` dónde termina el naranja y la barra lo
busca en el documento: mientras esa marca esté por debajo del borde de abajo de
la barra, hay naranja atrás. En las páginas sin hero no hay marca y la barra se
pinta normal sin que nadie le avise.

> **Al agregar un color a la barra, va adentro del ternario, no como clase
> extra.** Dos utilidades de color en el mismo elemento las decide el orden del
> CSS generado, no el orden en que se escriben: pisar `text-tenue` con un
> `text-sobre-hero` agregado al final es una lotería. Por eso `Etiqueta` y
> `BotonTema` reciben un prop en vez de un `className`.

### Botones sobre naranja

La variante `claro` (blanco con tinta oscura). La `primario` es naranja: sobre
el hero desaparecería.

---

## Tipografía

**Una sola familia: Manrope**, con una excepción de una palabra. La jerarquía
la dan el peso, el tamaño y el tracking, no el contraste entre dos tipografías.

La excepción es `font-cursiva` (`--font-cursiva`): una serif del sistema, en
cursiva, para **una sola palabra** del titular del hero. Es un recurso de
portada, no una segunda familia del sistema. Se usa una serif del sistema y no
una fuente descargada porque para un término no vale la pena sumar un archivo
al arranque; si el recurso se extendiera a más lugares, ahí sí conviene servir
una display italic propia vía `@fontsource`. Se sirve desde nuestro dominio
vía `@fontsource-variable/manrope`, importada en [src/main.tsx](src/main.tsx):
sin request a Google y sin parpadeo al cargar.

| Clase | Tamaño | Para qué |
|---|---|---|
| `text-display` | `clamp(2.25rem, 1.6rem + 3vw, 4rem)` | Titular del hero |
| `text-titulo` | `clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem)` | Título de página o sección |
| `text-subtitulo` | `clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem)` | Nombre de producto, bajadas |
| (por defecto) | `1rem` | Texto corrido |
| `text-sm` | `0.875rem` | Secundario, ayudas |
| `text-xs` | `0.75rem` | Etiquetas, legales |

Los tres primeros usan `clamp()`: escalan con el ancho de la pantalla, así que
entran en mobile sin romper la jerarquía y respiran en escritorio.

`h1`, `h2` y `h3` ya vienen con `font-weight: 600`, tracking cerrado y
`text-wrap: balance` desde el CSS base. No hace falta repetirlo.

**Números en columna**: usá `tabular-nums` siempre que haya precios alineados.
Sin eso, los dígitos tienen anchos distintos y las columnas bailan.

---

## Modo oscuro

Tres estados, no dos: **claro**, **oscuro**, o **seguir al sistema** si el
usuario nunca eligió. Lo maneja
[src/context/ThemeContext.tsx](src/context/ThemeContext.tsx), que pone y saca la
clase `.dark` en el `<html>`.

Si nadie eligió, el sitio sigue al sistema **en vivo**: cambiás el tema del
sistema operativo y el sitio acompaña, sin recargar.

**El script del `<head>`** en [index.html](index.html) aplica el tema *antes* de
que React monte. Sin eso, quien usa modo oscuro ve un destello blanco en cada
carga. Va inline y sin `type="module"` a propósito: los módulos se difieren, y
diferirlo sería volver a tener el destello.

Para condicionar algo al tema —debería ser raro— la variante es `dark:`:

```jsx
<div className="opacity-[0.55] dark:opacity-40" />
```

---

## Componentes

En [src/components/ui.tsx](src/components/ui.tsx). Existen para que un botón se
vea igual en todas las pantallas.

| Componente | Para qué |
|---|---|
| `Boton` | Acción. Variantes: `primario`, `secundario`, `fantasma` |
| `BotonLink` | Igual, pero navega (React Router) |
| `BotonAncla` | Igual, pero salta a un ancla de la misma página |
| `EnlaceFlecha` | Acción secundaria, con flecha, sin peso de botón |
| `Etiqueta` | Texto chico en mayúsculas con tracking |
| `Aviso` | Recuadro de advertencia |
| `Campo` | Etiqueta + campo + texto de ayuda |
| `entrada` | Clases compartidas por inputs y textareas |
| `Contenedor` | Ancho máximo y aire lateral |
| `FlechaCta` | La flecha que se corre al pasar el mouse |

```jsx
<Boton variante="primario" flecha>Agregar al carrito</Boton>
<BotonLink to="/catalogo" variante="secundario">Ver todo</BotonLink>
<Contenedor ancho="angosto">…</Contenedor>
```

`Contenedor` tiene dos anchos: `normal` para grillas y listados, `angosto` para
lectura y formularios. Los dos salen de tokens.

### Espaciado con nombre

| Token | Valor | Utilidad |
|---|---|---|
| `--spacing-seccion` | `4rem` | `py-seccion` |
| `--spacing-seccion-lg` | `6rem` | `py-seccion-lg` |
| `--spacing-gutter` | `1.25rem` | `px-gutter` |
| `--spacing-gutter-lg` | `2rem` | `px-gutter-lg` |
| `--container-normal` | `72rem` | `max-w-normal` |
| `--container-angosto` | `48rem` | `max-w-angosto` |

---

## Layout y espaciado

- **Separación entre hermanos con `gap`**, no con márgenes por elemento. Los
  márgenes se colapsan o se duplican en silencio.
- **Secciones**: `py-seccion sm:py-seccion-lg`. Los valores salen de tokens, no
  se escriben a mano: cambiar el ritmo de la página entera se hace en el CSS.
- **Grillas de producto**: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`.
- **Radio**: `rounded-pieza` (2px). Casi recto, a tono con el mueble. Los
  círculos completos (`rounded-full`) quedan solo para badges y flechas.
- **Contenido ancho** —tablas, código— va en su propio contenedor con
  `overflow-x-auto`. La página nunca scrollea de costado.

---

## Fotografía de producto

Toda foto de producto va por `FotoProducto`, que resuelve dos cosas que antes
se repetían mal en cada pantalla.

**Encaje.** La foto llena el marco con `object-cover`, recortando lo que sobra.

Se probó lo contrario —`object-contain` sobre fondo neutro, para que el mueble
entrara siempre completo— y se descartó: las bandas que quedaban a los costados
se leían como un marco alrededor de la imagen y ensuciaban la pieza. Entre
recortar y ese borde, se eligió recortar.

> **Pendiente.** El recorte sigue siendo un problema real con fotos verticales.
> La salida buena no es una clase de CSS sino normalizar el encuadre al cargar
> las fotos, o dejar que cada producto declare el suyo. Hasta entonces, subir
> las fotos ya encuadradas.

**Peso.** Si la URL es de Cloudinary, se le agregan transformaciones solas:

```
.../image/upload/w_800,c_limit,q_auto,f_auto/v1/binoma/banco.jpg
```

| | |
|---|---|
| `w_800` | El ancho que hace falta ahí, no los 4000 del original |
| `c_limit` | Achica si sobra, pero **nunca recorta ni deforma** |
| `q_auto` | Elige la compresión mirando la imagen |
| `f_auto` | AVIF o WebP según el navegador, JPG en los viejos |

Además genera `srcset`, para que una pantalla común no descargue el doble que
necesita solo porque existen las Retina.

Los anchos están en `ANCHOS` de [src/lib/imagen.ts](src/lib/imagen.ts), por uso:
`miniatura`, `tarjeta`, `bloque`, `ficha`. Si la URL no es de Cloudinary —un
placeholder, una foto de otro lado— se usa tal cual y no se rompe nada.

## Mobile

Se diseña para el teléfono y se ensancha, no al revés. Buena parte del tráfico
llega desde Instagram.

- **Barra fija al pie** en ficha de producto y carrito: en una pantalla larga el
  botón de comprar queda arriba y hay que ir a buscarlo. Va con el precio a la
  vista. Acordate de dejar `pb-28` en el contenedor para que no tape contenido.
- **Menú hamburguesa** que se cierra solo al navegar.
- **Carrusel de a una tarjeta** en mobile, de a dos desde `sm`: dos tarjetas en
  360px de ancho quedan ilegibles.
- Nada de `hover` como única forma de descubrir algo: en el teléfono no existe.

---

## Accesibilidad

Lo mínimo que no se negocia:

- **Foco visible**: ya está en el CSS base, contorno naranja. No lo saques.
- **`aria-label`** en botones que son solo un ícono (carrito, tema, flechas).
- **`role="alert"`** en errores, `role="status"` en avisos: los lectores de
  pantalla no ven que apareció un recuadro.
- **`aria-hidden="true"`** en todo lo decorativo: íconos junto a texto,
  esqueletos de carga, fondos.
- **Movimiento reducido**: el CSS base ya respeta `prefers-reduced-motion`.

---

## Patrones adoptados y descartados

Tomados de tiendas grandes (referencia: boconcept.com) y adaptados:

**Adoptados de tiendas grandes** — hero con antetítulo y titular en mayúsculas;
botones con flecha; ficha con línea de atributos bajo el precio; carrito con panel de resumen al costado; barra fija en mobile; pie
multicolumna.

**Adoptados de la propuesta de Stitch** — tokens de espaciado con nombre; hero
editorial con el mensaje a un lado y la pieza al otro; y dos formas de mostrar
producto según la pantalla:

- **Home** (`BloqueProducto`): un bloque por pieza, con su nombre, su precio y
  dos fotos. La grande muestra el mueble entero; la angosta, el detalle del
  canto o el ensamble, que es lo que distingue al fenólico. Con cuatro piezas
  conviene destacar cada una en vez de amontonarlas.
- **Catálogo** (`MosaicoProductos`): grilla uniforme, todas las fichas con el
  mismo recuadro vertical (`aspect-3/4`). Se probó mezclar proporciones —alta,
  ancha, cuadrada— y se descartó: el catálogo se veía desordenado y ninguna
  pieza se leía mejor que otra. Uniforme también recorta menos, porque las
  fotos de los muebles son verticales. El catálogo es para **comparar**, y para
  comparar hacen falta las mismas condiciones.

Los dos reemplazaron al carrusel, que escondía piezas detrás de un gesto de
arrastre.

**Rechazados de Stitch, a propósito** — cargar Manrope desde el CDN de Google
(la servimos nosotros, sin parpadeo ni pedido a terceros); la fuente de íconos
Material Symbols (usamos SVG en línea, que no descarga nada); su paleta de
Material, con un verde menta y un rosa que pelean con nuestros estados; y la
barra de navegación fija al pie en mobile, que chocaría con las barras de compra
que ya existen en ficha y carrito.

**Descartados a propósito** — mega menú de dos columnas, buscador, newsletter,
acordeones de ayuda, fila de categorías. Son patrones de un catálogo de miles de
productos: con seis piezas se ven vacíos y quedan peor que no tenerlos.

Cuando el catálogo crezca, el primero que conviene recuperar es el buscador.

---

## Lo que falta

**Fotografía de producto.** El sistema está armado alrededor de la imagen y hoy
son placeholders. El hero usa una textura de láminas de fenólico dibujada con
CSS: es un buen puente, no el destino. Cuando existan las fotos, esa sección es
la primera que conviene reemplazar.

**El panel de administración** tiene los tokens aplicados pero sin trabajo
visual fino. Es legible en los dos modos, que era lo mínimo.
