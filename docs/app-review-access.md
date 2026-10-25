# Passwordless Store Review Access

Groupi reviewers use the normal mobile email-code login, with a credential-protected inbox for one dedicated demo account. This setup does not introduce an app password, fixed code, public fixture API, or session bypass.

## Table of Contents

- [Provisioning](#provisioning)
- [Reviewer Instructions](#reviewer-instructions)
- [Security and Lifecycle](#security-and-lifecycle)

## Provisioning

1. Release the server changes through the normal reviewed deployment pipeline. The existing mobile binary needs no changes.
2. Generate a random 256-bit key represented by 64 lowercase hexadecimal characters and save it in a password manager. Do not put it in source control, chat, a URL, or a public document.
3. Run `zsh /Users/theia/repos/groupi/scripts/setup-app-review.sh` in an interactive terminal. On this Mac, use a narrowly scoped Warp launch configuration. The script receives the key without echoing it, stores only its SHA-256 hash on the server, creates private synthetic events and discussion content, pins the account ID, and enables the inbox for 60 days. It never deploys code or submits anything to Apple.
4. Record the returned email and account ID. The dedicated email is an identifier for the private code inbox, not an external email mailbox. Do not create an unrelated user with it before provisioning.
5. Verify the exact normal mobile send-code and verify-code flow against production, including resend, consumed-code rejection, and the sample poll/posts. Server integration tests are not a substitute for this on-device check.
6. In App Store Connect, keep **Sign-in required** checked. Supply the demo email as the user name and the inbox key as the password, explicitly explaining in review notes that this credential opens the private inbox; the app itself uses the six-digit code. This is not a fake app password.

Apple requires full review access, not a particular login technology. This arrangement must be clearly documented, but acceptance remains Apple's decision. See [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/#before-you-submit).

## Reviewer Instructions

Use the following instructions with the actual demo email substituted. Furnish the access key only through private store-review credential fields.

> Groupi uses passwordless email-code login. The supplied password is the access key for the private reviewer code inbox, not an app password.
>
> 1. Open Groupi and enter the supplied demo email, then select Continue with email.
> 2. Open https://trustworthy-warthog-524.convex.site/app-review/inbox in a browser. Enter the supplied inbox access key and select View current sign-in code.
> 3. Enter the displayed six-digit code in Groupi and select Verify code. Codes expire after 15 minutes and are single-use. For a fresh code, use Resend code in Groupi and check the inbox again.
> 4. The account contains private sample events, date polling, posts, and rich-text replies. It can create events and use normal app features. Sample data is synthetic.
> 5. Google, Discord, and passkeys are optional alternative login methods; they are not required to access this demo account.

Do not submit until the contact/feedback fields are complete, the inbox is live, and the credentials have been verified. Do not include a currently issued OTP in review notes: it would expire before review.

## Security and Lifecycle

- `APP_REVIEW_INBOX_ENABLED` is false by default. `APP_REVIEW_USER_ID` selects exactly one internally provisioned account; ordinary users cannot be repurposed by provisioning.
- Registry access expires within 90 days (the setup script uses 60). Missing, banned, privileged, revoked, expired, or email-changed accounts fail closed.
- The inbox reads only the existing Better Auth sign-in verification record. It does not store another OTP copy, expose magic links/reset codes, or create sessions. The plain `code:attempts` parser is deliberately pinned to the installed Better Auth format and rejects exhausted attempts. Revalidate it when upgrading Better Auth or changing OTP storage.
- Sign-in delivery for the active registered account is routed to this private inbox rather than an external mailbox. Other users keep ordinary delivery.
- The credential is accepted only in a bounded same-origin POST form. Responses are non-cacheable, non-indexable, non-frameable, and load no scripts or external assets. Treat the inbox key as a login credential for the demo account, never as a public beta invitation.
- The account is a normal non-admin user with private synthetic events and no initial real-event memberships. It rejects unsolicited friend/event invitations by default. Reviewers can change its settings and use normal features; inspect its state between reviews.
- Expiry or disabling the inbox does **not** revoke existing app sessions or remove OAuth/passkeys linked during testing. To close access, invoke internal `appReview/mutations:revoke` with the saved `accountId`; it marks the registry revoked, bans further sign-in, and deletes sessions in scheduled batches. Better Auth's existing cookie-cache freshness window still applies.
- After revoking, remove the two inbox environment variables. Provision a new account/key for a new review cycle; do not reopen a previously shared credential. Preserve synthetic data unless cleanup is explicitly requested.
