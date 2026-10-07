import {
  Bot,
  BrainCircuit,
  Cloud,
  Code2,
  Globe,
  Layers,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** সার্ভিস আইকন কী → Lucide কম্পোনেন্ট (editor + public services page দুটোতেই) */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  globe: Globe,
  smartphone: Smartphone,
  monitor: MonitorSmartphone,
  workflow: Workflow,
  bot: Bot,
  brain: BrainCircuit,
  wrench: Wrench,
  code: Code2,
  cloud: Cloud,
  shield: ShieldCheck,
  palette: Palette,
  zap: Zap,
  layers: Layers,
  message: MessageSquare,
  sparkles: Sparkles,
};

export const SERVICE_ICON_KEYS = Object.keys(SERVICE_ICONS);

export function serviceIcon(key?: string): LucideIcon {
  return (key && SERVICE_ICONS[key]) || Layers;
}
