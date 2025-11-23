## MultiChain Wallet — ETHGlobal

Dashboard y landing para gestionar wallets multichain, flujos de envío/recepción y un panel de off‑ramp con Circle.

### Requisitos
- Node 18+
- pnpm o npm

### Instalación
```bash
pnpm install   # o npm install
```

### Scripts útiles
- `pnpm dev` — Arranca en modo dev (Next.js).
- `pnpm lint` — Linter.

### Estructura relevante
- `app/page.tsx` — Landing.
- `app/dashboard/page.tsx` — Dashboard y modales (send/receive/add).
- `app/offramp/page.tsx` — Panel de off‑ramp (wire + payout) con Circle.
- `app/dashboard/components/` — Cards, topbar, modales y paneles.
- `app/api/circle/*` — Endpoints para link‑wire y payout (Circle).

### Variables de entorno
Crear `.env.local` en la raíz:
```
CIRCLE_API_KEY=TEST_API_KEY:...  # Tu key sandbox de Circle
```
Reinicia el server tras cambiar el .env.

### Off‑ramp Circle (wire + payout)
1) Crear cuenta wire: routing, account number, bank name → devuelve `destinationId`.
2) Crear payout: usa `destinationId`, amount (USD), idempotency auto.
3) Último payout ID se guarda en localStorage para reutilizar.
4) El panel tiene botón de cierre que vuelve al dashboard.

### Notas de UI/UX
- Tema oscuro con gradientes y cards redondeadas.
- En desktop, cards de “Cómo funciona” y “Nuestro enfoque” se disponen en diagonal.
- Secciones clave: hero, features, cómo funciona, enfoque, CTA final.

### Problemas comunes
- **Hydration mismatch**: revisar que el .env esté cargado y evitar contenido dinámico en SSR sin snapshot.
- **401 Circle**: valida formato de la API key (tres segmentos) y reinicia el server.
- **Montos payout**: mínimo 1.00 USD en sandbox.

### Próximos pasos
- Agregar tests básicos de UI y snapshot.
- Pulir textos y traducciones en landing.
