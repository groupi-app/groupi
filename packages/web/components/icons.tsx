import {
  User2 as Account,
  ArrowLeft,
  ArrowRight,
  Ban,
  PartyPopper as Party,
  Bell,
  BellOff,
  Bold,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock,
  Code,
  Copy,
  Crown,
  Calendar as Date,
  Trash as Delete,
  Download,
  Pencil as Edit,
  Eye,
  EyeOff,
  File,
  FileAudio,
  FileVideo,
  Fingerprint,
  Heading2,
  Heart,
  Image,
  Infinity as Infinite,
  Info,
  Key,
  LayoutDashboard,
  Lock,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  TriangleAlert as Warning,
  UserPlus as Invite,
  Italic,
  UserX as Kick,
  DoorOpen as Leave,
  Link,
  List,
  ListOrdered,
  Loader2,
  MapPin as Location,
  LucideIcon,
  LucideProps,
  Menu,
  MoreHorizontal,
  Paperclip,
  Users2 as People,
  Plus,
  QrCode,
  MailOpen as Read,
  MessageCircle as Reply,
  Save,
  Search,
  Settings,
  Sparkles,
  Undo2 as Undo,
  Shield,
  ShieldCheck,
  ShieldMinus,
  ShieldOff,
  ShieldPlus,
  PanelLeft as Sidebar,
  LogIn as SignIn,
  LogOut as SignOut,
  Strikethrough,
  Send as Submit,
  Timer as Time,
  Underline,
  Mail as Unread,
  X,
  Mail,
  Webhook,
  Megaphone,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  sidebar: Sidebar,
  info: Info,
  warning: Warning,
  alertTriangle: Warning, // Alias for warning
  read: Read,
  unread: Unread,
  bell: Bell,
  bellOff: BellOff,
  check: Check,
  infinity: Infinite,
  qr: QrCode,
  link: Link,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  ban: Ban,
  reply: Reply,
  plus: Plus,
  spinner: Loader2,
  menu: Menu,
  close: X,
  signIn: SignIn,
  signOut: SignOut,
  account: Account,
  people: People,
  users: People, // Alias for people
  user: Account, // Alias for account
  party: Party,
  delete: Delete,
  download: Download,
  edit: Edit,
  save: Save,
  search: Search,
  settings: Settings,
  undo: Undo,
  refresh: RefreshCw,
  alertCircle: CircleAlert,
  submit: Submit,
  back: ChevronLeft,
  forward: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
  more: MoreHorizontal,
  moreVertical: MoreVertical,
  messageSquare: MessageSquare,
  layoutDashboard: LayoutDashboard,
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  code: Code,
  list: List,
  listOrdered: ListOrdered,
  heading: Heading2,
  location: Location,
  mapPin: Location, // Alias for location
  date: Date,
  calendar: Date, // Alias for date
  time: Time,
  shield: Shield,
  shieldCheck: ShieldCheck,
  shieldMinus: ShieldMinus,
  shieldOff: ShieldOff,
  shieldPlus: ShieldPlus,
  crown: Crown,
  kick: Kick,
  copy: Copy,
  fingerprint: Fingerprint,
  invite: Invite,
  key: Key,
  leave: Leave,
  mail: Mail,
  webhook: Webhook,
  megaphone: Megaphone,
  clock: Clock,
  trash: Delete,
  x: X,
  sparkles: Sparkles,
  paperclip: Paperclip,
  attachment: Paperclip,
  file: File,
  fileAudio: FileAudio,
  fileVideo: FileVideo,
  image: Image,
  eye: Eye,
  eyeOff: EyeOff,
  spoiler: EyeOff,
  spoilerOff: Eye,
  heart: Heart,
  lock: Lock,
  discord: ({ ...props }: LucideProps) => (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
    </svg>
  ),
  google: ({ ...props }: LucideProps) => (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
        fill='#4285F4'
      />
      <path
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
        fill='#34A853'
      />
      <path
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
        fill='#FBBC05'
      />
      <path
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
        fill='#EA4335'
      />
    </svg>
  ),
  logo: ({ ...props }: LucideProps) => (
    <svg fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M62.4375 111.375C93.1929 111.375 118.125 86.4429 118.125 55.6875C118.125 24.9321 93.1929 0 62.4375 0C31.6821 0 6.75 24.9321 6.75 55.6875C6.75 86.4429 31.6821 111.375 62.4375 111.375Z'
        fill='currentColor'
      />
      <path
        d='M0 162.562C0 128.079 27.9542 100.125 62.4375 100.125C96.9208 100.125 124.875 128.079 124.875 162.562V225H0V162.562Z'
        fill='currentColor'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M183.022 42.0739C172.613 34.3539 157.916 36.5342 150.196 46.9438L107.263 104.833C121.956 114.28 131.906 129.83 134.24 147.243L187.892 74.9004C195.612 64.4908 193.432 49.7939 183.022 42.0739Z'
        fill='currentColor'
      />
    </svg>
  ),
  organizer: ({ ...props }: LucideProps) => (
    <svg
      fill='none'
      viewBox='0 0 298 298'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <g clipPath='url(#clip0_1_7)'>
        <path
          d='M133.438 166.375C164.193 166.375 189.125 141.443 189.125 110.688C189.125 79.9321 164.193 55 133.438 55C102.682 55 77.75 79.9321 77.75 110.688C77.75 141.443 102.682 166.375 133.438 166.375Z'
          fill='currentColor'
        />
        <path
          d='M71 217.562C71 183.079 98.9542 155.125 133.438 155.125C167.921 155.125 195.875 183.079 195.875 217.562V280H71V217.562Z'
          fill='currentColor'
        />
        <path
          d='M254.022 97.0739C243.613 89.3539 228.916 91.5342 221.196 101.944L178.263 159.833C192.956 169.28 202.906 184.83 205.24 202.243L258.892 129.9C266.612 119.491 264.432 104.794 254.022 97.0739Z'
          fill='currentColor'
        />
        <g clipPath='url(#clip1_1_7)'>
          <path
            d='M168.869 15.0741C169.043 14.9216 169.254 14.8185 169.482 14.7756C169.709 14.7327 169.943 14.7516 170.161 14.8302C170.378 14.9089 170.57 15.0444 170.717 15.2227C170.865 15.401 170.961 15.6156 170.997 15.8439L173.243 32.0518C173.3 32.4289 173.44 32.7887 173.653 33.1053C173.865 33.422 174.145 33.6877 174.472 33.8834C174.8 34.079 175.166 34.1997 175.546 34.2369C175.926 34.2741 176.309 34.2267 176.668 34.0983L190.278 28.9562C190.536 28.8662 190.816 28.8603 191.078 28.9396C191.339 29.0188 191.569 29.179 191.734 29.3971C191.899 29.6153 191.99 29.8801 191.995 30.1534C191.999 30.4268 191.917 30.6946 191.76 30.9183L175.871 53.3179C175.546 53.7763 175.081 54.1165 174.545 54.2866C174.01 54.4568 173.434 54.4477 172.904 54.2608L142.827 43.38C142.3 43.185 141.85 42.8233 141.547 42.3497C141.244 41.8761 141.104 41.3165 141.147 40.7559L143.269 13.3785C143.291 13.106 143.399 12.8476 143.578 12.6406C143.757 12.4335 143.996 12.2884 144.262 12.2262C144.529 12.164 144.808 12.1879 145.059 12.2944C145.311 12.4009 145.523 12.5846 145.664 12.819L152.831 25.4776C153.025 25.8061 153.289 26.0876 153.604 26.3019C153.92 26.5161 154.279 26.6579 154.656 26.717C155.032 26.7761 155.418 26.751 155.784 26.6436C156.149 26.5362 156.487 26.3491 156.772 26.0957L168.869 15.0741Z'
            fill='currentColor'
            stroke='currentColor'
            strokeWidth='4'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M138.783 48.4085L172.792 60.7121'
            stroke='currentColor'
            strokeWidth='4'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </g>
      </g>
    </svg>
  ),
  group: ({
    color2 = 'fill-muted-foreground',
    ...props
  }: LucideProps & { color2?: string }) => (
    <svg
      viewBox='0 0 553 298'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M133.438 166.375C164.193 166.375 189.125 141.443 189.125 110.688C189.125 79.9321 164.193 55 133.438 55C102.682 55 77.75 79.9321 77.75 110.688C77.75 141.443 102.682 166.375 133.438 166.375Z'
        className={color2}
      />
      <path
        d='M71 217.562C71 183.079 98.9542 155.125 133.438 155.125C167.921 155.125 195.875 183.079 195.875 217.562V280H71V217.562Z'
        className={color2}
      />
      <path
        d='M230.457 257.822C239.567 248.605 239.479 233.747 230.261 224.638L178.999 173.976C167.576 187.191 150.779 194.851 133.211 194.708L197.272 258.018C206.49 267.128 221.347 267.041 230.457 257.822Z'
        className={color2}
      />
      <path
        d='M409.438 166.375C440.193 166.375 465.125 141.443 465.125 110.688C465.125 79.9321 440.193 55 409.438 55C378.682 55 353.75 79.9321 353.75 110.688C353.75 141.443 378.682 166.375 409.438 166.375Z'
        className={color2}
      />
      <path
        d='M347 217.562C347 183.079 374.954 155.125 409.438 155.125C443.921 155.125 471.875 183.079 471.875 217.562V280H347V217.562Z'
        className={color2}
      />
      <path
        d='M506.457 257.822C515.567 248.605 515.479 233.747 506.261 224.638L454.999 173.976C443.576 187.191 426.779 194.851 409.211 194.708L473.272 258.018C482.49 267.128 497.347 267.041 506.457 257.822Z'
        className={color2}
      />
      <path
        d='M271.438 164.375C302.193 164.375 327.125 139.443 327.125 108.688C327.125 77.9321 302.193 53 271.438 53C240.682 53 215.75 77.9321 215.75 108.688C215.75 139.443 240.682 164.375 271.438 164.375Z'
        fill='currentColor'
      />
      <path
        d='M209 215.562C209 181.079 236.954 153.125 271.438 153.125C305.921 153.125 333.875 181.079 333.875 215.562V278H209V215.562Z'
        fill='currentColor'
      />
      <path
        d='M392.022 95.0739C381.613 87.3539 366.916 89.5342 359.196 99.9438L316.263 157.833C330.956 167.28 340.906 182.83 343.24 200.243L396.892 127.9C404.612 117.491 402.432 102.794 392.022 95.0739Z'
        fill='currentColor'
      />
    </svg>
  ),
};
