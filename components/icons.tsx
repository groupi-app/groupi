import { group } from "console";
import {
  LucideProps,
  X,
  Menu,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Bold,
  Strikethrough,
  Italic,
  Underline,
  Code,
  List,
  ListOrdered,
  Heading2,
  Save,
  Plus,
  Shield,
  ShieldOff,
  Crown,
  Check,
  Link,
  QrCode,
  DoorOpen as Leave,
  Infinity as Infinite,
  MessageCircle as Reply,
  Send as Submit,
  LogIn as SignIn,
  LogOut as SignOut,
  User2 as Account,
  Users2 as People,
  Trash as Delete,
  Pencil as Edit,
  MapPin as Location,
  Calendar as Date,
  Timer as Time,
  UserX as Kick,
  Copy,
  Bell,
  MailOpen as Read,
  Mail as Unread,
  UserPlus as Invite,
  type Icon as LucideIcon,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  read: Read,
  unread: Unread,
  bell: Bell,
  check: Check,
  infinity: Infinite,
  qr: QrCode,
  link: Link,
  arrowRight: ArrowRight,
  reply: Reply,
  plus: Plus,
  spinner: Loader2,
  menu: Menu,
  close: X,
  signIn: SignIn,
  signOut: SignOut,
  account: Account,
  people: People,
  delete: Delete,
  edit: Edit,
  save: Save,
  submit: Submit,
  back: ChevronLeft,
  forward: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
  more: MoreHorizontal,
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  code: Code,
  list: List,
  listOrdered: ListOrdered,
  heading: Heading2,
  location: Location,
  date: Date,
  time: Time,
  shield: Shield,
  shieldOff: ShieldOff,
  crown: Crown,
  kick: Kick,
  copy: Copy,
  invite: Invite,
  leave: Leave,
  logo: ({ ...props }: LucideProps) => (
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M62.4375 111.375C93.1929 111.375 118.125 86.4429 118.125 55.6875C118.125 24.9321 93.1929 0 62.4375 0C31.6821 0 6.75 24.9321 6.75 55.6875C6.75 86.4429 31.6821 111.375 62.4375 111.375Z"
        fill="currentColor"
      />
      <path
        d="M0 162.562C0 128.079 27.9542 100.125 62.4375 100.125C96.9208 100.125 124.875 128.079 124.875 162.562V225H0V162.562Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M183.022 42.0739C172.613 34.3539 157.916 36.5342 150.196 46.9438L107.263 104.833C121.956 114.28 131.906 129.83 134.24 147.243L187.892 74.9004C195.612 64.4908 193.432 49.7939 183.022 42.0739Z"
        fill="currentColor"
      />
    </svg>
  ),
  organizer: ({ ...props }: LucideProps) => (
    <svg
      fill="none"
      viewBox="0 0 298 298"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clip-path="url(#clip0_1_7)">
        <path
          d="M133.438 166.375C164.193 166.375 189.125 141.443 189.125 110.688C189.125 79.9321 164.193 55 133.438 55C102.682 55 77.75 79.9321 77.75 110.688C77.75 141.443 102.682 166.375 133.438 166.375Z"
          fill="currentColor"
        />
        <path
          d="M71 217.562C71 183.079 98.9542 155.125 133.438 155.125C167.921 155.125 195.875 183.079 195.875 217.562V280H71V217.562Z"
          fill="currentColor"
        />
        <path
          d="M254.022 97.0739C243.613 89.3539 228.916 91.5342 221.196 101.944L178.263 159.833C192.956 169.28 202.906 184.83 205.24 202.243L258.892 129.9C266.612 119.491 264.432 104.794 254.022 97.0739Z"
          fill="currentColor"
        />
        <g clip-path="url(#clip1_1_7)">
          <path
            d="M168.869 15.0741C169.043 14.9216 169.254 14.8185 169.482 14.7756C169.709 14.7327 169.943 14.7516 170.161 14.8302C170.378 14.9089 170.57 15.0444 170.717 15.2227C170.865 15.401 170.961 15.6156 170.997 15.8439L173.243 32.0518C173.3 32.4289 173.44 32.7887 173.653 33.1053C173.865 33.422 174.145 33.6877 174.472 33.8834C174.8 34.079 175.166 34.1997 175.546 34.2369C175.926 34.2741 176.309 34.2267 176.668 34.0983L190.278 28.9562C190.536 28.8662 190.816 28.8603 191.078 28.9396C191.339 29.0188 191.569 29.179 191.734 29.3971C191.899 29.6153 191.99 29.8801 191.995 30.1534C191.999 30.4268 191.917 30.6946 191.76 30.9183L175.871 53.3179C175.546 53.7763 175.081 54.1165 174.545 54.2866C174.01 54.4568 173.434 54.4477 172.904 54.2608L142.827 43.38C142.3 43.185 141.85 42.8233 141.547 42.3497C141.244 41.8761 141.104 41.3165 141.147 40.7559L143.269 13.3785C143.291 13.106 143.399 12.8476 143.578 12.6406C143.757 12.4335 143.996 12.2884 144.262 12.2262C144.529 12.164 144.808 12.1879 145.059 12.2944C145.311 12.4009 145.523 12.5846 145.664 12.819L152.831 25.4776C153.025 25.8061 153.289 26.0876 153.604 26.3019C153.92 26.5161 154.279 26.6579 154.656 26.717C155.032 26.7761 155.418 26.751 155.784 26.6436C156.149 26.5362 156.487 26.3491 156.772 26.0957L168.869 15.0741Z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M138.783 48.4085L172.792 60.7121"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </g>
    </svg>
  ),
  group: ({ color2, ...props }: LucideProps & { color2: string }) => (
    <svg
      viewBox="0 0 553 298"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M133.438 166.375C164.193 166.375 189.125 141.443 189.125 110.688C189.125 79.9321 164.193 55 133.438 55C102.682 55 77.75 79.9321 77.75 110.688C77.75 141.443 102.682 166.375 133.438 166.375Z"
        className={color2}
      />
      <path
        d="M71 217.562C71 183.079 98.9542 155.125 133.438 155.125C167.921 155.125 195.875 183.079 195.875 217.562V280H71V217.562Z"
        className={color2}
      />
      <path
        d="M230.457 257.822C239.567 248.605 239.479 233.747 230.261 224.638L178.999 173.976C167.576 187.191 150.779 194.851 133.211 194.708L197.272 258.018C206.49 267.128 221.347 267.041 230.457 257.822Z"
        className={color2}
      />
      <path
        d="M409.438 166.375C440.193 166.375 465.125 141.443 465.125 110.688C465.125 79.9321 440.193 55 409.438 55C378.682 55 353.75 79.9321 353.75 110.688C353.75 141.443 378.682 166.375 409.438 166.375Z"
        className={color2}
      />
      <path
        d="M347 217.562C347 183.079 374.954 155.125 409.438 155.125C443.921 155.125 471.875 183.079 471.875 217.562V280H347V217.562Z"
        className={color2}
      />
      <path
        d="M506.457 257.822C515.567 248.605 515.479 233.747 506.261 224.638L454.999 173.976C443.576 187.191 426.779 194.851 409.211 194.708L473.272 258.018C482.49 267.128 497.347 267.041 506.457 257.822Z"
        className={color2}
      />
      <path
        d="M271.438 164.375C302.193 164.375 327.125 139.443 327.125 108.688C327.125 77.9321 302.193 53 271.438 53C240.682 53 215.75 77.9321 215.75 108.688C215.75 139.443 240.682 164.375 271.438 164.375Z"
        fill="currentColor"
      />
      <path
        d="M209 215.562C209 181.079 236.954 153.125 271.438 153.125C305.921 153.125 333.875 181.079 333.875 215.562V278H209V215.562Z"
        fill="currentColor"
      />
      <path
        d="M392.022 95.0739C381.613 87.3539 366.916 89.5342 359.196 99.9438L316.263 157.833C330.956 167.28 340.906 182.83 343.24 200.243L396.892 127.9C404.612 117.491 402.432 102.794 392.022 95.0739Z"
        fill="currentColor"
      />
    </svg>
  ),
};
