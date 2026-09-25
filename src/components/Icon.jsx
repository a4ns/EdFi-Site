import {
  ArrowLeftRight, Award, Building2, CalendarCheck, CircleHelp, Flame, FlaskConical, GraduationCap,
  HeartHandshake, Map as MapIcon, Mic, PiggyBank, QrCode, Smartphone, Trophy,
} from 'lucide-react';

const ICONS = {
  ArrowLeftRight, Award, Building2, CalendarCheck, CircleHelp, Flame, FlaskConical, GraduationCap,
  HeartHandshake, Map: MapIcon, Mic, PiggyBank, QrCode, Smartphone, Trophy,
};

// Resolves icon names used in src/data/content.js.
export default function Icon({ name, ...props }) {
  const Cmp = ICONS[name] ?? CircleHelp;
  return <Cmp {...props} />;
}
