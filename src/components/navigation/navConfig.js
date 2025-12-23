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
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import GroupIcon from '@mui/icons-material/GroupRounded';
import DoneAllIcon from '@mui/icons-material/DoneAllRounded';
import RestaurantIcon from '@mui/icons-material/RestaurantRounded';
import QrCodeIcon from '@mui/icons-material/QrCodeScannerRounded';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import EventIcon from '@mui/icons-material/EventRounded';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumberRounded';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoomRounded';
import CalendarTodayIcon from '@mui/icons-material/CalendarTodayRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesomeRounded';
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
        roles: ['student', 'faculty', 'admin'],
    },
    {
        label: 'Derslerim',
        path: '/my-courses',
        icon: ClassIcon,
        roles: ['student'],
    },
    {
        label: 'Bitirilmiş Dersler',
        path: '/completed-courses',
        icon: DoneAllIcon,
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
        roles: ['faculty'],
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
        roles: ['faculty'],
    },
    {
        label: 'Mazeret Talepleri',
        path: '/excuse-requests',
        icon: AssignmentTurnedInIcon,
        roles: ['student', 'faculty'],
    },
    {
        label: 'Ders Yönetimi',
        path: '/admin/courses',
        icon: SettingsIcon,
        roles: ['admin'],
    },
    {
        label: 'Section Yönetimi',
        path: '/admin/sections',
        icon: GroupIcon,
        roles: ['admin'],
    },
    {
        label: 'Bölüm Yönetimi',
        path: '/admin/departments',
        icon: SchoolIcon,
        roles: ['admin'],
    },
    {
        label: 'Öğrenci Yönetimi',
        path: '/admin/students',
        icon: GroupIcon,
        roles: ['admin'],
    },
    {
        label: 'Yemek Yönetimi',
        path: '/admin/meals',
        icon: RestaurantIcon,
        roles: ['admin'],
    },
    {
        label: 'Yemekhane',
        path: '/meals',
        icon: RestaurantIcon,
        roles: ['student', 'faculty', 'admin'],
    },
    {
        label: 'Cüzdanım',
        path: '/wallet',
        icon: AccountBalanceWalletIcon,
        roles: ['student', 'faculty'],
    },
    {
        label: 'Yemek Teslim (QR)',
        path: '/admin/meals/scan',
        icon: QrCodeIcon,
        roles: ['admin', 'cafeteria_staff'],
    },
    {
        label: 'Etkinlikler',
        path: '/events',
        icon: EventIcon,
        roles: ['student', 'faculty', 'admin'],
    },
    {
        label: 'Etkinliklerim',
        path: '/my-tickets',
        icon: ConfirmationNumberIcon,
        roles: ['student', 'faculty'],
    },
    {
        label: 'Etkinlik Yönetimi',
        path: '/admin/events',
        icon: EventIcon,
        roles: ['admin'],
    },
    {
        label: 'Etkinlik Giriş (QR)',
        path: '/admin/events/check-in',
        icon: QrCodeIcon,
        roles: ['admin'],
    },
    {
        label: 'Derslik Rezervasyonu',
        path: '/reservations',
        icon: MeetingRoomIcon,
        roles: ['student', 'faculty'],
    },
    {
        label: 'Ders Programım',
        path: '/schedule',
        icon: CalendarTodayIcon,
        roles: ['student', 'faculty'],
    },
    {
        label: 'Derslik Yönetimi',
        path: '/admin/classrooms',
        icon: MeetingRoomIcon,
        roles: ['admin'],
    },
    {
        label: 'Program Oluştur',
        path: '/admin/scheduling/generate',
        icon: AutoAwesomeIcon,
        roles: ['admin'],
    },
    {
        label: 'Rezervasyon Onayları',
        path: '/admin/reservations',
        icon: FactCheckIcon,
        roles: ['admin'],
    },
];
