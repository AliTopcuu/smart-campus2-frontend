import DashboardIcon from '@mui/icons-material/DashboardRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import type { UserRole } from '@/types/auth';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  roles?: UserRole[];
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
  },
  {
    label: 'Profil',
    path: '/profile',
    icon: PersonIcon,
  },
];

