import {
  getPUSHER_APP_ID,
  getNEXT_PUBLIC_PUSHER_APP_KEY,
  getPUSHER_APP_SECRET,
  getNEXT_PUBLIC_PUSHER_APP_CLUSTER,
} from './env';
import PusherServer from 'pusher';

let _pusherServer: PusherServer | null = null;

export const getPusherServer = (): PusherServer => {
  if (!_pusherServer) {
    _pusherServer = new PusherServer({
      appId: getPUSHER_APP_ID(),
      key: getNEXT_PUBLIC_PUSHER_APP_KEY(),
      secret: getPUSHER_APP_SECRET(),
      cluster: getNEXT_PUBLIC_PUSHER_APP_CLUSTER(),
      useTLS: true,
    });
  }
  return _pusherServer;
};
