# Direct enquiry delivery

Activated 20 October 2026. Both destination addresses are verified. The Worker sends only to dean@arcworc.com (general, creative, events, Academy) or clint@arcworc.com (artist bookings). The sender is website@notify.arcworc.com, with the visitor's email in Reply-To.

Cloudflare Email Routing is configured only on notify.arcworc.com. The original apex Zoho MX records are unchanged. Sending to these verified destinations uses the free path; no paid plan was subscribed to.

`arcworc-enquiries` handles only `/api/enquiry` on arcworc.com and www.arcworc.com. The workers.dev endpoint supports the same form on this project's Pages preview URLs, with a restricted origin list and CORS preflight. It has fixed recipients, bounded bodies, field validation, a honeypot and a 3-per-minute per-IP edge rate limiter. User message content is not logged. The frontend retains filled fields and offers email/copy fallback on errors. API success means accepted for delivery, not proof of inbox placement.

The Worker was deployed through Cloudflare's native API as a module. For raw multipart uploads, remove the named helper function exports used by unit tests, retaining the default Worker export. `wrangler.jsonc` records the equivalent deployment configuration. The static frontend remains on the existing Pages Direct Upload project `arcworc-preview`.
