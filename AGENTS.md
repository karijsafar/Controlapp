<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## CONTROLAPP architecture
- Use TanStack file routes and shared CONTROLAPP presentation modules under `src/components/controlapp`; keeping routing separate from reusable screens preserves native navigation.
- Private pages live under `src/routes/_authenticated` (client-only gate); diagnoses are saved through authenticated server functions in `src/lib/diagnoses.functions.ts` that recompute ratios server-side, so clients cannot forge results.
- Define all visual tokens and screen styles in `src/styles.css` and use the shared shadcn controls; this keeps the selected identity consistent.
- Financial ratios and traffic lights live only in `src/lib/diagnosis.ts` as pure deterministic functions with tests; AI must never decide colors or figures.
- File reading: Excel is converted to text in the browser, PDFs sent inline; `src/lib/extraction.functions.ts` (auth server fn) asks AI only to extract figures, which the user reviews before saving — keeps figures user-confirmed.
- Reports: AI analysis text is generated once per diagnosis by `generateAnalysis` and cached in `analisis_ia`; public links use a revocable `share_token` read only by the `getSharedReport` server fn, which returns safe fields; PDF is the browser print of the report with an A4 print stylesheet — no extra PDF library.
