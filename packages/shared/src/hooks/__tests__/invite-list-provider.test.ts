import { createRequire } from 'node:module';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { createInviteListHooks } from '../useInviteLists';

const nativeRequire = createRequire(
  new URL('../../../../mobile/package.json', import.meta.url)
);
const renderer = nativeRequire(
  nativeRequire.resolve('react-test-renderer', {
    paths: [nativeRequire.resolve('@testing-library/react-native')],
  })
);

describe('invite-list hooks with actual application providers', () => {
  beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
  afterEach(() => vi.unstubAllGlobals());
  for (const platform of ['web', 'mobile']) {
    it(`uses the ${platform} SDK context without depending on shared's installed SDK copy`, async () => {
      const appRequire = createRequire(
        new URL(`../../../../${platform}/package.json`, import.meta.url)
      );
      const appSdk = appRequire('convex/react');
      const hooks = createInviteListHooks(api, appSdk);
      let mutation: unknown;
      let draftPeople: unknown = Symbol('not rendered');
      let tree: { unmount: () => void } | undefined;
      function MutationProbe() {
        mutation = hooks.useCreateInviteList();
        draftPeople = hooks.useInviteListDraftPeople([]);
        return null;
      }

      await renderer.act(async () => {
        tree = renderer.create(
          createElement(
            appSdk.ConvexProvider,
            { client: {} },
            createElement(MutationProbe)
          )
        );
      });
      expect(mutation).toBeTypeOf('function');
      expect(draftPeople).toBeUndefined();
      await renderer.act(async () => tree?.unmount());
    });
  }
});
