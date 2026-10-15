# One-time support contributions

The shared web footer reads `NEXT_PUBLIC_SUPPORT_URL` from public site
configuration. Set it to the installation's Stripe Payment Link. An omitted,
empty, or whitespace-only value hides Support Groupi; there is no default payment
account. Configured URLs must use HTTPS. This is a public checkout URL, never a
Stripe API key. As with other `NEXT_PUBLIC_*` settings, changing it requires a new
web deployment.

The footer appears on both public and authenticated routes. Checkout opens in a
new tab with `noopener noreferrer`, and Groupi passes the configured URL without
adding an account identifier. Contributions grant no membership, recognition,
or perks. Stripe holds payment records and owns confirmation; this flow has no
Groupi payment tables, webhooks, or payment secrets. Future Groupi World
navigation must use a separate destination.

## Operator verification before activation

Use Stripe test mode before production. Configure and verify:

- Customer-chosen amounts in USD, with $5 suggested and a $1 minimum.
- One-time payments, with no subscription or recurring price.
- Checkout copy describing support for Groupi's hosting and development.
- Stripe's thank-you confirmation after a successful test payment.

Set the test Payment Link as `NEXT_PUBLIC_SUPPORT_URL` for the test deployment.
Check the rendered footer while signed out and signed in, at desktop and narrow
mobile widths, including visible keyboard focus and Enter activation. Confirm
checkout opens separately and returning preserves the original Groupi page.
Also verify a deployment with the URL omitted hides the link.

A verified live Stripe Payment Link is required for production activation.
Record the test results and live-link verification with the release; source
validation alone does not establish Stripe configuration or payment success.
No live charge is required to verify the footer implementation.
