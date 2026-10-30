'use client';

import { LegalPage } from '@/components/templates/legal-page';

export default function SupportPage() {
  return (
    <LegalPage title='Groupi Support'>
      <section>
        <p>Groupi is operated by Theia Surette.</p>
        <p>
          For help, email{' '}
          <a href='mailto:support@groupi.gg'>support@groupi.gg</a>. For privacy
          or account-data requests, email{' '}
          <a href='mailto:privacy@groupi.gg'>privacy@groupi.gg</a>.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Report a problem</h2>
        <p>
          Include your device model, iOS version, Groupi version/build if
          available, what you were trying to do, and what happened. Include
          reproduction steps and, if helpful, a screenshot with private
          information removed.
        </p>
        <p>
          Never send passwords, one-time codes, passkeys, API keys or other
          secrets. Avoid sharing other people’s private event content.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Signing in</h2>
        <p>
          Use the sign-in method connected to your account. For email-code login
          in the iOS app, check the address entered and your spam folder.
          Request a fresh code if the previous one expired. If problems
          continue, contact support from your account’s email address where
          possible.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Notifications and invitations</h2>
        <p>
          Check notification permissions in iOS Settings and notification or
          mute preferences inside Groupi. For invitation problems, ask the
          organizer whether the invitation remains active. Keep private
          invitation links private.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Content or safety concerns</h2>
        <p>
          Email <a href='mailto:support@groupi.gg'>support@groupi.gg</a> with
          enough information to identify the issue, avoiding unnecessary
          sensitive details. For immediate danger, contact local emergency
          services; Groupi support is not an emergency service.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Account deletion</h2>
        <p>
          Open Settings → Account → Danger Zone → Delete Account. Resolve
          ownership responsibilities shown by the app and follow the
          confirmation steps. If you cannot access your account or deletion
          fails, email <a href='mailto:privacy@groupi.gg'>privacy@groupi.gg</a>.
          Removing the app does not itself delete your account.
        </p>
      </section>
    </LegalPage>
  );
}
