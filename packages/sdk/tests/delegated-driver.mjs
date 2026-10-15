/* global fetch */
import { createInterface } from 'node:readline';
import process from 'node:process';
import console from 'node:console';
import { Groupi, DelegatedSession } from '../src/index.js';
let client, session, config, state;
const realNow = Date.now;
for await (const line of createInterface({ input: process.stdin })) {
  try {
    const command = JSON.parse(line);
    let result;
    if (command.operation === 'initialize') {
      config = {
        ...command.config,
        storeTokens: async value => {
          state = value;
        },
      };
      if (config.clientType === 'confidentialWeb')
        config.getClientAssertion = async () => {
          const response = await fetch(
            config.instance + '/test/client-assertion'
          );
          return (await response.json()).client_assertion;
        };
      session = await DelegatedSession.fromAuthorizationCode(
        config,
        command.exchange
      );
      client = new Groupi({
        instance: config.instance,
        credential: session.credential(),
      });
      result = { initialized: true, grantedActions: state.grantedActions };
    } else if (command.operation === 'bounded') {
      client = new Groupi({
        instance: command.instance,
        credential: { type: 'boundedApiKey', key: command.key },
      });
      result = { initialized: true };
    } else if (command.operation === 'read')
      result = await client.getEvent({ path: { eventId: command.eventId } });
    else if (command.operation === 'write')
      result = await client.updateEvent({
        path: { eventId: command.eventId },
        body: { title: 'Not approved' },
      });
    else if (command.operation === 'renew') {
      const before = state.refreshToken;
      Date.now = () => realNow() + 301000;
      const event = await client.getEvent({
        path: { eventId: command.eventId },
      });
      result = {
        id: event.id,
        rotated: before !== state.refreshToken,
        grantedActions: state.grantedActions,
      };
    } else if (command.operation === 'refresh') {
      await session.refresh();
      result = { grantedActions: state.grantedActions };
    } else throw new Error('Unknown operation');
    console.log(JSON.stringify({ ok: true, result }));
  } catch (error) {
    console.log(
      JSON.stringify({
        ok: false,
        status: error.status ?? 0,
        code: error.code ?? error.name,
        uncertain: error.uncertain ?? false,
      })
    );
  }
}
