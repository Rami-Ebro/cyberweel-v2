# CyberWeel AI Assistant MVP

## Architecture

`Chat UI → /api/ai/chat → AI Gateway → Gemini provider adapter`

The public assistant has no tools and no direct database access. Only the dedicated lead endpoint can create a record, and it writes to the existing `PartnerReferral` workflow with `source=AI_CHAT`. No schema migration is required.

## Data handling

- Chat history stays in browser `sessionStorage` for the current tab and is not saved by CyberWeel.
- The server sends at most the 10 latest messages and 12,000 characters to Gemini.
- Email addresses, phone-like values, and long sensitive numbers are redacted before provider calls.
- The lead form is separate from the model call. Contact details are sent only to CyberWeel.
- Saved lead data: name, supplied contact route, company if provided, original need, detected language, suggested service, and an Arabic summary.
- Gemini requests set `store=false`; Free Tier terms may still allow Google to use submitted content to improve products, so the UI warns users and minimizes the transmitted data.
- The first message is disabled until the visitor explicitly accepts that privacy notice for the browser session.

## Free-tier-only guard

The provider is locked to `gemini-3.5-flash-lite`, has no paid fallback, and refuses to start unless `GEMINI_FREE_TIER_ONLY=true`. The API key must belong to a Google AI Studio project whose billing tier is **Free** and which has no billing account linked. Code alone cannot verify the billing state of the external Google project.

When quota is exhausted, rate limited, unavailable, or timed out, the assistant shows a localized handoff message and makes no second provider call.

## Required environment variables

- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-3.5-flash-lite`
- `GEMINI_FREE_TIER_ONLY=true`

Never expose these values through `NEXT_PUBLIC_*` variables.
