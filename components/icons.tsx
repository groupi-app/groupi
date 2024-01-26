import {
  LucideProps,
  X,
  Menu,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
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
  Send as Submit,
  Shield,
  LogIn as SignIn,
  LogOut as SignOut,
  User2 as Account,
  Trash as Delete,
  Pencil as Edit,
  MapPin as Location,
  Calendar as Date,
  UserX as Kick,
  type Icon as LucideIcon,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  plus: Plus,
  spinner: Loader2,
  menu: Menu,
  close: X,
  signIn: SignIn,
  signOut: SignOut,
  account: Account,
  delete: Delete,
  edit: Edit,
  save: Save,
  submit: Submit,
  back: ChevronLeft,
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
  shield: Shield,
  kick: Kick,
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
};
