import DashboardIcon from '@mui/icons-material/DashboardRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import SchoolIcon from '@mui/icons-material/SchoolRounded';
import ClassIcon from '@mui/icons-material/ClassRounded';
import GradeIcon from '@mui/icons-material/GradeRounded';
import MenuBookIcon from '@mui/icons-material/MenuBookRounded';
import PlayCircleIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import MapIcon from '@mui/icons-material/MapRounded';
import FactCheckIcon from '@mui/icons-material/FactCheckRounded';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
export const navItems = [
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
    {
        label: 'Dersler',
        path: '/courses',
        icon: SchoolIcon,
    },
    {
        label: 'Derslerim',
        path: '/my-courses',
        icon: ClassIcon,
        roles: ['student'],
    },
    {
        label: 'Notlarım',
        path: '/grades',
        icon: GradeIcon,
        roles: ['student'],
    },
    {
        label: 'Not Defteri',
        path: '/gradebook',
        icon: MenuBookIcon,
        roles: ['faculty', 'admin'],
    },
    {
        label: 'Yoklama Başlat',
        path: '/attendance/start',
        icon: PlayCircleIcon,
        roles: ['faculty', 'admin'],
    },
    {
        label: 'Yoklama Durumum',
        path: '/my-attendance',
        icon: MapIcon,
        roles: ['student'],
    },
    {
        label: 'QR Kod ile Katıl',
        path: '/attendance/scan',
        icon: CheckCircleIcon,
        roles: ['student'],
    },
    {
        label: 'Yoklama Raporları',
        path: '/attendance/report',
        icon: FactCheckIcon,
        roles: ['faculty', 'admin'],
    },
    {
        label: 'Mazeret Talepleri',
        path: '/excuse-requests',
        icon: AssignmentTurnedInIcon,
        roles: ['student', 'faculty', 'admin'],
    },
];
