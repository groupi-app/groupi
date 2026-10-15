/* global AbortController */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Groupi } from '../src/index.js';
test('explicit credentials retrieve events across an empty continuation page', async () => {
  const server = createServer((req, res) => {
    assert.equal(req.headers['x-api-key'], 'grp_test');
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify(
        req.url.includes('cursor=next')
          ? { items: [{ _id: 'event1', title: 'Dinner' }], nextCursor: null }
          : { items: [], nextCursor: 'next' }
      )
    );
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = new Groupi({
      instance: `http://127.0.0.1:${server.address().port}`,
      credential: { type: 'apiKey', key: 'grp_test' },
    });
    const result = [];
    for await (const event of client.iterateEvents()) result.push(event);
    assert.equal(result[0].title, 'Dinner');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
test('unsafe creates preserve replay keys and never retry an uncertain response', async () => {
  let calls = 0;
  const server = createServer((req, res) => {
    if (req.url === '/api/v2/health') {
      res.end(
        JSON.stringify({
          version: '2.0.0',
          capabilities: { eventCreationIdempotency: { version: 1 } },
        })
      );
      return;
    }
    calls++;
    assert.equal(req.headers['idempotency-key'], '1700000000000.aaaa');
    req.socket.destroy();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const client = new Groupi({
      instance: `http://127.0.0.1:${server.address().port}`,
      credential: { type: 'apiKey', key: 'grp_test' },
    });
    await assert.rejects(
      client.createEvent(
        { body: { title: 'Dinner' } },
        { idempotencyKey: '1700000000000.aaaa' }
      ),
      error => error.uncertain === true
    );
    assert.equal(calls, 1);
  } finally {
    server.closeAllConnections();
    await new Promise(r => server.close(r));
  }
});
test('redirects cannot forward instance credentials', async () => {
  const server = createServer((req, res) => {
    res.writeHead(302, { Location: 'http://127.0.0.1:1/steal' });
    res.end();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const client = new Groupi({
      instance: `http://127.0.0.1:${server.address().port}`,
      credential: { type: 'apiKey', key: 'grp_test' },
    });
    await assert.rejects(
      client.listEvents(),
      error => error.code === 'REDIRECT_REFUSED'
    );
  } finally {
    server.closeAllConnections();
    await new Promise(r => server.close(r));
  }
});
test('permission denial remains structured and is not retried', async () => {
  let calls = 0;
  const server = createServer((req, res) => {
    calls++;
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: { code: 'FORBIDDEN', message: 'Membership required' },
      })
    );
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const client = new Groupi({
      instance: `http://127.0.0.1:${server.address().port}`,
      credential: { type: 'apiKey', key: 'grp_test' },
    });
    await assert.rejects(
      client.listEvents(),
      error =>
        error.code === 'FORBIDDEN' &&
        error.status === 403 &&
        error.uncertain === false
    );
    assert.equal(calls, 1);
  } finally {
    server.closeAllConnections();
    await new Promise(r => server.close(r));
  }
});
test('cancelling a dispatched create preserves uncertainty', async () => {
  const controller = new AbortController();
  const server = createServer((req, res) => {
    if (req.url === '/api/v2/health') {
      res.end(JSON.stringify({ version: '2.0.0' }));
      return;
    }
    controller.abort();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const client = new Groupi({
      instance: `http://127.0.0.1:${server.address().port}`,
      credential: { type: 'apiKey', key: 'grp_test' },
    });
    await assert.rejects(
      client.createEvent(
        { body: { title: 'Dinner' } },
        { signal: controller.signal }
      ),
      error => error.uncertain === true
    );
  } finally {
    server.closeAllConnections();
    await new Promise(r => server.close(r));
  }
});
test('a delegated provider cannot switch the configured audience', async()=>{
 const client=new Groupi({instance:'https://example.com',credential:{type:'delegated',audience:'groupi-api',getToken:async()=>({accessToken:'token',instance:'https://example.com',audience:'other-api'})}});
 await assert.rejects(client.listEvents(),error=>error.code==='UNAUTHORIZED');
});
test('version mismatch prevents dispatching a write',async()=>{
 let writes=0;
 const server=createServer((req,res)=>{if(req.method==='POST')writes++;res.end(JSON.stringify({version:'1.0.0'}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const client=new Groupi({instance:`http://127.0.0.1:${server.address().port}`,credential:{type:'apiKey',key:'grp_test'}});
  await assert.rejects(client.createEvent({body:{title:'Dinner'}}),error=>error.code==='INCOMPATIBLE_API');
  assert.equal(writes,0);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('stored delegated credentials cannot move to another instance or client',async()=>{
 const {DelegatedSession}=await import('../src/index.js');
 const config={instance:'https://one.example',issuer:'https://one.example/oauth',audience:'https://one.example/api/v2',clientId:'client-one',clientType:'native',actions:['events.read']};
 const state={...config,background:true,accessToken:'access',refreshToken:'refresh',expiresAt:Date.now()+300000,grantedActions:['events.read']};
 assert.throws(()=>DelegatedSession.restore({...config,instance:'https://two.example',issuer:'https://two.example/oauth',audience:'https://two.example/api/v2'},state),error=>error.code==='INVALID_TOKEN_RESPONSE');
 assert.throws(()=>DelegatedSession.restore({...config,clientId:'client-two'},state),error=>error.code==='INVALID_TOKEN_RESPONSE');
 const session=DelegatedSession.restore(config,state);
 assert.equal((await session.getToken({instance:config.instance,audience:config.audience})).accessToken,'access');
});
