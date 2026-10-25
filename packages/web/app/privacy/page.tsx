'use client';

import { LegalPage } from '@/components/templates/legal-page';

export default function PrivacyPage() {
  return (
    <LegalPage title='Groupi Privacy Policy'>
      <section>
        <p>Last updated: October 22, 2026.</p>
        <p>
          Groupi is operated by Theia Surette. This policy describes how
          information is handled when you use the Groupi app, website and
          related services.
        </p>
        <p>
          For privacy questions or requests, email{' '}
          <a href='mailto:privacy@groupi.gg'>privacy@groupi.gg</a>. For product
          support, email{' '}
          <a href='mailto:support@groupi.gg'>support@groupi.gg</a>.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Information we process</h2>
        <p>
          We process account and profile information such as your name, email,
          username, avatar, biography and pronouns; event and group details,
          invitations, availability and RSVPs; and posts, replies, photos, files
          and other contributions you provide.
        </p>
        <p>
          We also process authentication and session records, registered passkey
          public credentials, notification preferences and device push tokens,
          and information needed to investigate support requests, reports and
          abuse. Registering a passkey does not give Groupi your device’s
          biometric template.
        </p>
        <p>
          When you use a connected sign-in provider such as Google or Discord,
          we receive the account details and permissions authorized through that
          connection.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>How information is used</h2>
        <p>
          We use information to operate accounts, events, groups, invitations
          and conversations; deliver requested notifications; maintain
          connections you enable; respond to support requests; investigate
          misuse; and protect the service.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Visibility and service providers</h2>
        <p>
          Your contributions are available according to the audiences,
          permissions and features you use. Organizers and moderators can access
          information needed to manage participation. Other users may copy or
          share content they can access.
        </p>
        <p>
          We share information with service providers needed to operate Groupi,
          including hosting, storage, email, authentication, diagnostics and
          notifications. Connected services may also process information under
          their own privacy policies.
        </p>
        <p>
          Groupi uses Convex for backend services and storage, Vercel for web
          hosting, Resend for email, Sentry for website diagnostics, and Expo
          and platform push services for notifications. Google and Discord
          support enabled account connections.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Website diagnostics and session replay</h2>
        <p>
          Groupi’s website uses Sentry for error diagnostics, performance
          monitoring and sampled session replay to help troubleshoot problems
          and improve reliability. Session replay can record interactions with
          web pages.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Retention and deletion</h2>
        <p>
          We do not apply a single fixed retention period to all user data. You
          can request account deletion through Settings → Account → Danger Zone
          → Delete Account, or contact{' '}
          <a href='mailto:privacy@groupi.gg'>privacy@groupi.gg</a> for help.
        </p>
        <p>
          Resolve any event or group ownership responsibilities shown by the
          app, then follow the confirmation steps. Removing the app from your
          device does not delete your account.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Your choices and requests</h2>
        <p>
          You can edit available profile details, manage notification
          preferences and available privacy controls, and disconnect supported
          integrations. Device settings control notification, camera and photo
          permissions.
        </p>
        <p>
          For requests to access, correct or delete personal information, or
          exercise other rights available where you live, email{' '}
          <a href='mailto:privacy@groupi.gg'>privacy@groupi.gg</a>. We may need
          to verify your identity.
        </p>
      </section>
      <section>
        <h2 className='font-heading'>Changes and contact</h2>
        <p>
          Updates will appear on this page with a revised date. Questions about
          this policy can be sent to{' '}
          <a href='mailto:privacy@groupi.gg'>privacy@groupi.gg</a>.
        </p>
      </section>
    </LegalPage>
  );
}
