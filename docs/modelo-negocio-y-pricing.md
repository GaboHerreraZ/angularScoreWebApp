# CREDITIA — Modelo de Negocio y Pricing

> Documento de trabajo interno. Define la estructura de costos, el precio por consulta, la
> proyección de ventas y la repartición entre socios. Cifras en pesos colombianos (COP),
> **sin IVA** salvo que se indique. Última revisión: junio 2026.

---

## 1. Contexto

CREDITIA es una plataforma SaaS de análisis crediticio enfocada en **PYMES colombianas** que
venden a crédito y necesitan decidir a quién aprobar cupo, pero **no pueden acceder
directamente a Datacrédito ni a plataformas de análisis costosas**.

El valor central: por cada cliente que una PYME quiere evaluar, CREDITIA:

1. Analiza sus estados financieros (extracción PDF + 10ible+ indicadores: EBITDA, Z-Score, etc.).
2. **Contrasta la información con el historial crediticio real en Datacrédito** (centrales de riesgo).
3. Genera un score 0–100 y un análisis con IA.

> **Referencia de mercado:** un análisis crediticio equivalente, contratando a un asesor externo,
> le cuesta a una PYME **más de $200.000** por estudio. CREDITIA lo entrega en minutos por una
> fracción de ese valor — ese es el ancla de precio.

La unidad de negocio es **la consulta** (un estudio de crédito que toca Datacrédito). El cliente
paga por consultas; nosotros pagamos a Datacrédito por consulta + un contrato anual fijo.

---

## 2. Costo de Datacrédito (insumo principal)

Datacrédito se contrata vía **RUSER CONSULTORES SAS / Experian** con un **valor anual fijo** que
constituye una bolsa de consultas. El costo unitario depende de la oferta y del tipo de consulta:

- **Mi Decisor PN** (Persona Natural): historial, puntaje, ingresos vs. endeudamiento, comportamiento de pago.
- **Mi Decisor PJ** (Persona Jurídica): equivalente para empresas.
- Las consultas PN y PJ son **excluyentes** (salen de la misma bolsa anual).

| Oferta | Cód. | Valor anual | Costo consulta **PN** | Consultas PN/año | Costo consulta **PJ** | Consultas PJ/año |
|--------|------|-------------|-----------------------|------------------|-----------------------|------------------|
| Avanzado B + HDC | 1109 | $12.144.000 | $4.500 | 2.699 | $8.418 | 1.443 |
| Avanzado C + HDC | 1110 | $14.308.800 | $4.200 | 3.407 | $7.190 | 1.990 |
| Avanzado D + HDC | 1111 | $17.820.000 | $3.850 | 4.629 | $6.590 | 2.704 |

**Lectura clave:** el "valor anual" **ya incluye** las consultas. Es decir, el costo por consulta
es `valor anual ÷ consultas incluidas`. A mayor oferta, más barata cada consulta pero mayor
compromiso anual fijo. Oferta válida hasta el 16 de junio de 2026. *Contacto Experian: Ángel Andrés
Barreto Pinzón — 311 289 2958 — angel.barreto@experian.com.*

### Recomendación de oferta de arranque

Empezar con la **Oferta B (1109)** — el menor compromiso fijo ($12.144.000/año ≈ **$1.012.000/mes**).
Migrar a C o D solo cuando el volumen real de consultas se acerque al tope de B. No tiene sentido
pagar el contrato de D ($17.8M) si no vas a usar ~4.600 consultas/año.

> El modelo de abajo usa el costo unitario de **PN en Oferta B = $4.500** como caso base (la
> mayoría de clientes PYME evaluarán personas naturales / pequeños negocios). El PJ es ~$8.418
> y debe cobrarse más caro al cliente (ver §4).

---

## 3. Costos fijos de infraestructura

| Concepto | Costo mensual | Costo mensual (COP)* | Costo anual (COP) |
|----------|---------------|----------------------|-------------------|
| Datacrédito (Oferta B) | — | $1.012.000 | $12.144.000 |
| Supabase | USD 20 | $84.000 | $1.008.000 |
| DocuService (firma) | USD 25 | $105.000 | $1.260.000 |
| Railway | USD 5 | $21.000 | $252.000 |
| ePayco | — | $75.000 | $900.000 |
| Vercel | Gratis | $0 | $0 |
| **Total fijo** | | **≈ $1.297.000/mes** | **≈ $15.564.000/año** |

\* Conversión estimada a **$4.200 COP/USD**. Ajustar según TRM real. El rubro dominante es
Datacrédito (~78% del costo fijo); el resto de infraestructura suma apenas ~$285.000/mes.

> Nota: Vercel hoy es gratis pero escalará a un plan pago (~USD 20/mes) con tráfico. Railway y
> Supabase también suben por uso. Provisiona un colchón del **+30%** sobre infraestructura no-Datacrédito.

---

## 3.1. Costo variable de IA por análisis (Análisis con IA)

Cada estudio que use el **Análisis con IA** consume tokens de un LLM. El motor soporta varios modelos
(`gemini-2.5-pro`, `gemini-2.5-flash`, `claude-haiku-4-5-20251001`), con un techo de **4.096 tokens de
salida** por análisis. Este es un costo **variable** (solo se paga cuando el usuario pide el análisis IA),
a diferencia del fijo de Datacrédito/infra.

**Supuesto de tokens por análisis:** ~6.000 de entrada (estados financieros extraídos + indicadores +
prompt) + ~4.096 de salida (la narrativa máxima configurada).

| Modelo | Precio in / out (USD por 1M tok) | Costo por análisis (USD) | **En COP (×4.200)** |
|--------|----------------------------------|--------------------------|---------------------|
| Gemini 2.5 Flash | $0.30 / $2.50 | $0.0120 | **~$50** |
| Claude Haiku 4.5 | $1.00 / $5.00 | $0.0265 | **~$111** |
| Gemini 2.5 Pro | $1.25 / $10.00 | $0.0485 | **~$204** |

> **Conclusión:** el costo de IA por consulta va de **~$50 (Flash)** a **~$204 (Gemini Pro)** COP. Incluso
> con el modelo más caro, sigue siendo marginal frente al precio de venta de la consulta ($25.000+). Como
> caso base para el costeo se usa **~$111 (Haiku 4.5)** — buen balance de calidad/precio para texto en
> español. Si quieres exprimir el margen, **Flash** baja el costo a ~$50 sin afectar la rentabilidad.
>
> *Precios de Claude verificados (Haiku 4.5 = $1/$5 por 1M tok); los de Gemini son referencia pública y
> deben confirmarse con la consola de Google al contratar. Los tokens reales por análisis pueden variar —
> re-medir con un estudio representativo.*

---

## 4. Definición del precio por consulta

### 4.1 Costo real por consulta (incluyendo el fijo)

El error sería costear solo los $4.500 de Datacrédito. El contrato anual es fijo: si vendes pocas
consultas, el costo real por consulta se dispara. **Costo efectivo por consulta = (costo fijo
anual total) ÷ (consultas vendidas en el año).**

| Consultas vendidas/año | Costo fijo total ÷ consultas | Costo real por consulta |
|------------------------|------------------------------|-------------------------|
| 500 | $15.564.000 ÷ 500 | **$31.128** |
| 1.000 | $15.564.000 ÷ 1.000 | **$15.564** |
| 2.000 | $15.564.000 ÷ 2.000 | **$7.782** |
| 2.699 (tope Oferta B) | $15.564.000 ÷ 2.699 | **$5.767** |

Esto demuestra que **el negocio se vuelve rentable con volumen**: por debajo de ~1.000 consultas/año
el costo unitario real es alto; cerca del tope de la bolsa, baja a ~$5.800.

### 4.2 Precio sugerido al cliente

Con el ancla de mercado de **$200.000** por estudio externo, hay muchísimo margen. Pero el
posicionamiento PYME pide un precio accesible que se sienta una ganga frente al asesor externo y a
la vez deje margen sano. Propuesta:

El costo variable por consulta es **Datacrédito + IA** (caso base IA = Haiku 4.5 ~$111):

| Tipo de consulta | Costo Datacrédito | Costo IA (Haiku) | Costo variable total | **Precio sugerido** | Margen bruto/consulta | Múltiplo |
|------------------|-------------------|------------------|----------------------|---------------------|-----------------------|----------|
| Persona Natural (PN) | $4.500 | ~$111 | ~$4.611 | **$25.000** | ~$20.389 | 5,4× |
| Persona Jurídica (PJ) | $8.418 | ~$111 | ~$8.529 | **$40.000** | ~$31.471 | 4,7× |

Razonamiento:
- **$25.000 PN** es ~8× más barato que los $200.000 de un asesor externo → propuesta irresistible para PYME.
- El costo de IA (~$111 con Haiku, ~$50 con Gemini Flash) es **marginal** frente al de Datacrédito y al
  precio de venta — apenas mueve el margen (de ~$20.500 a ~$20.389). Usar Flash lo deja casi en $20.450.
- El margen bruto por consulta (sin prorratear fijo) ronda **~$20.400**, suficiente para cubrir el
  costo fijo prorrateado y dejar utilidad real una vez superado el punto de equilibrio (§5).
- Mantener PN/PJ diferenciados porque el costo de Datacrédito casi se duplica en PJ.
- **Nota:** la IA solo se cobra/consume si el estudio usa Análisis con IA; en estudios sin IA el costo
  variable es solo el de Datacrédito.

> **Modelo de cobro: paquetes prepagados de consultas** (no "ilimitado"). Vender bolsas
> (ej. 10, 25, 50, 100 consultas) que el cliente consume. Esto: (a) protege tu margen contra un
> cliente que abuse del volumen, (b) calza con tu propio modelo de bolsa con Datacrédito, (c) da
> caja por adelantado. El plan a la medida que ya mostramos en el landing se traduce en "¿cuántas
> consultas/mes necesitas?".

---

## 5. Punto de equilibrio

**Punto de equilibrio (break-even)** = costo fijo anual ÷ margen bruto por consulta.

Usando precio PN $25.000 y costo $4.500 → margen bruto $20.500:

```
$15.564.000 ÷ $20.500 ≈ 760 consultas/año ≈ 64 consultas/mes
```

A partir de **~64 consultas vendidas al mes** (todas PN), CREDITIA cubre todos sus costos fijos.
Cada consulta adicional es casi pura utilidad ($20.500 c/u, menos comisión ePayco ~3%).

> Si la mezcla incluye PJ (margen mayor), el equilibrio baja. 760 consultas/año es **muy
> alcanzable**: equivale a ~13 clientes PYME haciendo ~5 estudios/mes.

---

## 6. Proyección mensual y anual de ventas

Tres escenarios, asumiendo precio promedio ponderado **$27.000/consulta** (mezcla 80% PN + 20% PJ)
y costo Datacrédito promedio ~$5.200/consulta.

### Escenario conservador — 80 consultas/mes (960/año)

| Métrica | Mensual | Anual |
|---------|---------|-------|
| Ingresos | $2.160.000 | $25.920.000 |
| Costo Datacrédito variable | $416.000 | $4.992.000 |
| Costo fijo (infra + contrato) | $1.297.000 | $15.564.000 |
| **Utilidad operativa** | **$447.000** | **$5.364.000** |

### Escenario base — 150 consultas/mes (1.800/año)

| Métrica | Mensual | Anual |
|---------|---------|-------|
| Ingresos | $4.050.000 | $48.600.000 |
| Costo Datacrédito variable | $780.000 | $9.360.000 |
| Costo fijo | $1.297.000 | $15.564.000 |
| **Utilidad operativa** | **$1.973.000** | **$23.676.000** |

### Escenario optimista — 225 consultas/mes (2.700/año ≈ tope Oferta B)

| Métrica | Mensual | Anual |
|---------|---------|-------|
| Ingresos | $6.075.000 | $72.900.000 |
| Costo Datacrédito variable | $1.170.000 | $14.040.000 |
| Costo fijo | $1.297.000 | $15.564.000 |
| **Utilidad operativa** | **$3.608.000** | **$43.296.000** |

> En el escenario optimista ya estarías agotando la bolsa de la Oferta B → momento de migrar a C o D,
> que **bajan el costo unitario** y suben el margen. Es decir, el modelo mejora al crecer.

**Techo teórico vendiendo toda la bolsa anual de la Oferta B (2.699 consultas PN a $25.000):**
ingresos ≈ **$67.475.000/año**; restando costo total (~$27.7M entre contrato Datacrédito agotado +
infra) → utilidad ≈ **$39.700.000/año**. Con Oferta C o D el techo sube por mayor volumen y menor
costo unitario.

---

## 7. Modalidad de ganancia para los socios

Son **dos socios**: un Contador Público y un Desarrollador de Software. Propuesta de estructura
financiera, en orden de prioridad sobre cada peso que entra:

### Cascada de distribución de la utilidad

1. **Costos fijos primero** (Datacrédito, infra, ePayco). Intocables.
2. **Reserva de reinversión / colchón — 30% de la utilidad operativa.** Fondo común para:
   marketing, escalar a Oferta C/D, planes pagos de Vercel/Railway, imprevistos y meses flojos.
   No se reparte.
3. **Salarios base (pro-labore)** — solo cuando el flujo de caja lo permita de forma sostenida
   (recomendado: a partir del escenario base, ~150 consultas/mes). Sugerencia inicial modesta e
   **igual para ambos** (ej. $1.500.000–$2.000.000 c/u) para no descapitalizar la operación.
4. **Utilidad repartible (lo que queda)** — dividida **50/50** entre los dos socios.

### Por qué 50/50

El aporte es complementario y de igual peso estratégico: sin el software no hay producto; sin el
contador no hay credibilidad técnica del scoring, relación con Datacrédito ni respaldo financiero/
contable ante las PYMES. Mantener 50/50 evita fricción y refleja sociedad real.

> Alternativa si los aportes de tiempo se vuelven dispares: separar **"equity" (50/50 fijo, sobre
> utilidades)** de **"pro-labore" (pago por trabajo efectivo)**, de modo que quien dedique más horas
> operativas reciba más salario, pero la propiedad y los dividendos sigan 50/50.

### Ejemplo numérico (escenario base, utilidad operativa anual $23.676.000)

| Destino | % | Monto anual | Monto mensual aprox. |
|---------|---|-------------|----------------------|
| Reinversión / colchón | 30% | $7.102.800 | $591.900 |
| Utilidad repartible | 70% | $16.573.200 | $1.381.100 |
| → Socio 1 (Contador) | 35% | $8.286.600 | $690.550 |
| → Socio 2 (Desarrollador) | 35% | $8.286.600 | $690.550 |

> Este reparto es **además** de cualquier pro-labore que ya hayan tomado en el paso 3. En etapa
> temprana es sano priorizar la reinversión sobre el reparto: cada peso reinvertido en conseguir
> clientes multiplica el margen porque el costo fijo ya está pagado.

---

## 8. Recomendaciones estratégicas

1. **Arranca con Oferta B.** Menor riesgo de compromiso fijo. Migra a C/D cuando el volumen lo justifique.
2. **Vende paquetes de consultas prepagados**, no acceso ilimitado. Protege el margen y da caja anticipada.
3. **Diferencia precio PN vs. PJ** — el costo de Datacrédito casi se duplica en PJ.
4. **Punto de equilibrio realista:** ~64 consultas/mes. Enfoca los primeros 6 meses 100% en cruzar ese umbral.
5. **No bajes de $25.000/consulta PN.** Aún así eres ~8× más barato que el asesor externo; bajar más
   erosiona el margen sin necesidad, dado el ancla de mercado.
6. **Vigila el tope de la bolsa anual.** Vender por encima de las consultas incluidas implica renegociar
   el contrato; planifica la migración de oferta con anticipación.
7. **Provisiona el alza de infraestructura** (Vercel/Railway/Supabase suben con el uso) dentro del 30% de reinversión.
8. **Factura siempre IVA aparte** — los valores de Datacrédito y este modelo son sin IVA.

---

## 9. Supuestos y pendientes

- TRM usada: **$4.200 COP/USD** (ajustar a la real al momento del contrato).
- No incluye IVA en ingresos ni costos (revisar régimen tributario de la sociedad con el contador socio).
- No incluye costo de adquisición de cliente (CAC) ni gastos de marketing — deben salir del fondo de reinversión.
- La comisión de ePayco por transacción (~2,99% + fijo) reduce levemente el margen; modelarla cuando se
  defina el precio final con IVA.
- El costo de IA por análisis está cuantificado en §3.1 (~$50–$204 COP según el modelo; caso base Haiku
  4.5 ~$111). Se asumieron ~6.000 tokens de entrada + 4.096 de salida — re-medir con un estudio real para
  afinar, y confirmar los precios de Gemini con la consola de Google (los de Claude están verificados).
```
