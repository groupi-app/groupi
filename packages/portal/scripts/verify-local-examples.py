import urllib.request, time, signal
import http.server, ssl, threading, subprocess, os, tempfile, json, pathlib, socket, sys
ROOT=pathlib.Path(sys.argv[1])
state={'mode':'ok','posts':0,'events':{},'requests':[]}
class Handler(http.server.BaseHTTPRequestHandler):
 def log_message(self,*a): pass
 def send(self,data,status=200):
  body=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_GET(self):
  state['requests'].append(('GET',self.path))
  if state['mode']=='delegated': assert self.headers.get('Authorization')=='Bearer fixture-bearer' and not self.headers.get('x-api-key')
  if self.path=='/api/v2/profile':
   if state['mode']=='redirect': self.send_response(302);self.send_header('Location',base+'/unexpected');self.end_headers();return
   self.send({'personId':'fixture-person'});return
  if self.path.startswith('/api/v2/groups/fixture-group/events?'):
   if 'cursor=' not in self.path: self.send({'items':[],'nextCursor':'opaque +/='});return
   assert 'cursor=opaque' in self.path
   self.send({'items':[{'event':{'id':'fixture-event','title':'Group preview'},'canWithdraw':False}],'nextCursor':None});return
  if self.path.startswith('/api/v2/events?'):
   if state['mode']=='paginated':
    if 'cursor=' not in self.path: self.send({'items':[],'nextCursor':'opaque +/='});return
    from urllib.parse import urlsplit, parse_qs
    assert parse_qs(urlsplit(self.path).query)['cursor']==['opaque +/=']
    self.send({'items':[{'id':'fixture-event'}],'nextCursor':None});return
   self.send({'items':[],'nextCursor':None});return
  if self.path.startswith('/api/v2/events/'):
   if state['mode']=='denied': self.send({'error':'forbidden'},403);return
   self.send({'id':'fixture-event','title':state.get('title','My first Groupi Event'),'chosenDateTime':None});return
  self.send({'error':'unexpected'},404)
 def do_PATCH(self):
  state['requests'].append(('PATCH',self.path))
  assert self.path=='/api/v2/events/fixture-event'
  value=json.loads(self.rfile.read(int(self.headers.get('Content-Length',0))))
  assert set(value)=={'title'} and not self.headers.get('Idempotency-Key')
  state['title']=value['title'];self.send({'eventId':'fixture-event'})
 def do_POST(self):
  state['requests'].append(('POST',self.path));state['posts']+=1
  body=self.rfile.read(int(self.headers.get('Content-Length',0))).decode(); value=json.loads(body)
  assert self.path=='/api/v2/events' and set(value)=={'title'}
  request_id=self.headers.get('Idempotency-Key'); assert request_id and '.' in request_id
  if state['mode']=='denied':self.send({'error':'forbidden'},403);return
  if request_id in state['events']: assert state['events'][request_id]==body
  else: state['events'][request_id]=body
  state['title']=value['title']
  if state['mode']=='lost': state['mode']='ok';self.connection.shutdown(socket.SHUT_RDWR);self.connection.close();return
  self.send({'eventId':'fixture-event','membershipId':'fixture-membership'},201)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);ctx.load_cert_chain(ROOT/'fixture-cert.pem',ROOT/'fixture-key.pem');server.socket=ctx.wrap_socket(server.socket,server_side=True)
base='https://127.0.0.1:'+str(server.server_port)
threading.Thread(target=server.serve_forever,daemon=True).start()
env=dict(os.environ,GROUPI_API_URL=base+'/api/v2',GROUPI_WEB_URL=base,GROUPI_CONFIRMED_API_URL=base+'/api/v2',GROUPI_CONFIRMED_WEB_URL=base,GROUPI_EXPECTED_PERSON_ID='fixture-person',GROUPI_API_KEY='grp_fixture_not_a_real_key',GROUPI_ALLOW_CREATE='yes',GROUPI_EVENT_TITLE="Theia's café <test>",GROUPI_EVENT_ID='fixture-event',NODE_EXTRA_CA_CERTS=str(ROOT/'fixture-cert.pem'),SSL_CERT_FILE=str(ROOT/'fixture-cert.pem'),CURL_CA_BUNDLE=str(ROOT/'fixture-cert.pem'))
results=[]
def run(command,cwd,overrides=None):
 e=env.copy();e.update(overrides or {})
 return subprocess.run(command,cwd=cwd,env=e,text=True,capture_output=True,timeout=40)
for ext,runtime in [('mts',['node']),('py',['python3']),('sh',['bash'])]:
 command=runtime+[str(ROOT/('first-event.'+ext))]
 with tempfile.TemporaryDirectory(prefix='groupi-example-') as directory:
  state.update(mode='lost',posts=0,events={},requests=[])
  first=run(command,directory); assert first.returncode!=0,(ext,'lost should fail')
  second=run(command,directory); assert second.returncode==0,(ext,second.stdout,second.stderr)
  third=run(command,directory); assert third.returncode==0,(ext,third.stderr)
  assert state['posts']==2 and len(state['events'])==1,(ext,state)
  assert 'Open in Groupi: '+base+'/event/fixture-event' in second.stdout
  changed=run(command,directory,{'GROUPI_EVENT_TITLE':'Changed'}); assert changed.returncode!=0 and state['posts']==2
  results.append({'language':ext,'case':'lost response replay + repeat + changed payload','passed':True,'posts':2,'createdEvents':1})
 for mode,overrides in [('ok',{'GROUPI_EXPECTED_PERSON_ID':'wrong'}),('redirect',{}),('denied',{}),('ok',{'GROUPI_CONFIRMED_API_URL':'https://wrong.example/api/v2'})]:
  with tempfile.TemporaryDirectory(prefix='groupi-example-') as directory:
   state.update(mode=mode,posts=0,events={},requests=[])
   result=run(command,directory,overrides)
   assert result.returncode!=0,(ext,mode,'should stop')
   assert not state['events'] and (state['posts']==(1 if mode=='denied' else 0)),(ext,mode,state)
   assert not any(path=='/unexpected' for method,path in state['requests'])
   results.append({'language':ext,'case':mode+' '+str(list(overrides)),'passed':True})
 with tempfile.TemporaryDirectory(prefix='groupi-example-') as directory:
  state.update(mode='ok',posts=0,events={},requests=[],title="Theia's café <test>")
  process=subprocess.Popen(runtime+[str(ROOT/('widget.'+ext))],cwd=directory,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
  try:
   url=process.stdout.readline().strip()
   assert url.startswith('http://127.0.0.1:'),(ext,url,process.poll())
   html=urllib.request.urlopen(url).read().decode()
   assert 'Refresh' in html and 'Loading' in html and 'textContent' in html
   assert env['GROUPI_API_KEY'] not in html
   projected=json.load(urllib.request.urlopen(url+'data'))
   assert projected['event']['id']=='fixture-event' and state['posts']==0
   assert env['GROUPI_API_KEY'] not in json.dumps(projected)
   subprocess.run(['node',str(pathlib.Path(__file__).with_name('verify-widget-display.mjs')),url,'Loaded'],check=True)
   state['mode']='denied'
   subprocess.run(['node',str(pathlib.Path(__file__).with_name('verify-widget-display.mjs')),url,'Unable'],check=True)
   try: urllib.request.urlopen(url+'data'); raise AssertionError('Denied read must fail')
   except urllib.error.HTTPError as error: assert error.code==502
   assert state['posts']==0
   try: urllib.request.urlopen(urllib.request.Request(url,headers={'Host':'attacker.example'})); raise AssertionError('Host must fail')
   except urllib.error.HTTPError as error: assert error.code==403
   results.append({'language':ext,'case':'loopback widget HTML and real server-side retrieval','passed':True})
  finally:
   os.killpg(process.pid,signal.SIGTERM);process.wait(timeout=5)
  state['mode']='ok'
  empty_env=env.copy();empty_env.pop('GROUPI_EVENT_ID')
  process=subprocess.Popen(runtime+[str(ROOT/('widget.'+ext))],cwd=directory,env=empty_env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
  try:
   url=process.stdout.readline().strip()
   assert json.load(urllib.request.urlopen(url+'data'))=={'event':None}
   subprocess.run(['node',str(pathlib.Path(__file__).with_name('verify-widget-display.mjs')),url,'No accessible'],check=True)
   results.append({'language':ext,'case':'widget empty success','passed':True})
   state.update(mode='paginated',requests=[])
   projected=json.load(urllib.request.urlopen(url+'data'))
   assert projected['event']['id']=='fixture-event',(ext,'empty intermediate page is not empty success',projected)
   assert len([p for m,p in state['requests'] if p.startswith('/api/v2/events?')])==2
   subprocess.run(['node',str(pathlib.Path(__file__).with_name('verify-widget-display.mjs')),url,'Loaded'],check=True)
   results.append({'language':ext,'case':'widget follows opaque cursor past empty first page','passed':True})
  finally:
   os.killpg(process.pid,signal.SIGTERM);process.wait(timeout=5)


 with tempfile.TemporaryDirectory(prefix='groupi-recipe-') as directory:
  state.update(mode='ok',posts=0,events={},requests=[])
  result=run(runtime+[str(ROOT/('groups.'+ext))],directory,{'GROUPI_GROUP_ID':'fixture-group'})
  assert result.returncode==0 and 'Group previews: 1' in result.stdout,(ext,result.stderr)
  assert state['posts']==0 and len([p for m,p in state['requests'] if '/groups/' in p])==2
  results.append({'language':ext,'case':'Group pagination through empty page','passed':True})
  result=run(runtime+[str(ROOT/('update.'+ext))],directory)
  assert result.returncode!=0 and not any(m=='PATCH' for m,p in state['requests'])
  result=run(runtime+[str(ROOT/('update.'+ext))],directory,{'GROUPI_ALLOW_UPDATE':'yes'})
  assert result.returncode==0 and 'Verified title update:' in result.stdout,(ext,result.stderr)
  assert len([m for m,p in state['requests'] if m=='PATCH'])==1
  results.append({'language':ext,'case':'Explicit title update and read-back','passed':True})

  state.update(mode='delegated',requests=[])
  result=run(runtime+[str(ROOT/('delegated.'+ext))],directory,{'GROUPI_ISSUER':base+'/oauth','GROUPI_ACCESS_TOKEN':'fixture-bearer'})
  assert result.returncode==0 and json.loads(result.stdout)['id']=='fixture-event',(ext,result.stderr)
  assert state['requests']==[('GET','/api/v2/events/fixture-event')]
  results.append({'language':ext,'case':'Post-consent selected Event read, Bearer only, no profile','passed':True})

server.shutdown()
print(json.dumps({'checks':len(results),'results':results,'evidence':'Loopback HTTPS fixture, no live Groupi credentials or writes'},indent=2))
