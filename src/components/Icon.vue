<script setup lang="ts">
import {
  Home,
  Files,
  BriefcaseBusiness,
  LayoutGrid,
  Bell,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Users,
  PawPrint,
  FileText,
  Baby,
  HeartHandshake,
  QrCode,
  Settings2,
  X,
  Check,
  ShieldCheck,
  CalendarDays,
  Mail,
  Plus,
  RotateCcw,
  Clock3,
  Search,
  Car,
  Eye,
  CircleHelp,
  CircleAlert,
  LogOut,
  Send,
} from "lucide-vue-next";
defineProps<{ name: string; size?: number }>();
const icons: Record<string, any> = {
  home: Home,
  documents: Files,
  cases: BriefcaseBusiness,
  more: LayoutGrid,
  bell: Bell,
  assistant: MessageCircle,
  arrow: ArrowRight,
  back: ArrowLeft,
  chevron: ChevronRight,
  users: Users,
  paw: PawPrint,
  document: FileText,
  baby: Baby,
  heart: HeartHandshake,
  qr: QrCode,
  settings: Settings2,
  close: X,
  check: Check,
  shield: ShieldCheck,
  calendar: CalendarDays,
  mail: Mail,
  plus: Plus,
  reset: RotateCcw,
  clock: Clock3,
  search: Search,
  car: Car,
  eye: Eye,
  help: CircleHelp,
  alert: CircleAlert,
  logout: LogOut,
  send: Send,
};
</script>
<template>
  <component
    :is="icons[name] || FileText"
    :size="size || 22"
    :stroke-width="1.7"
    aria-hidden="true"
  />
</template>
