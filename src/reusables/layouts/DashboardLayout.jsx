import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Constants from '../../utils/Constants';
import CustomIcon from '../CustomIcon';
import Logo from '../Logo';
import { useUser } from '../../hooks/UserProvider';
import CustomerDAO from '../../daos/CustomerDao';
import PropertyDAO from '../../daos/propertyDao';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const todayMidnight = new Date();
todayMidnight.setHours(0, 0, 0, 0);

const getDiffDays = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - todayMidnight) / (1000 * 60 * 60 * 24));
};

// ─── Hook: ambil notifikasi dari customer & property ─────────────────────────
function useNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, propRes] = await Promise.allSettled([
        CustomerDAO.getAllCustomers(),
        PropertyDAO.getAllProperties(),
      ]);

      const result = [];

      // ── Kendaraan ──
      if (custRes.status === 'fulfilled') {
        const custs = custRes.value?.customers || custRes.value?.data || (Array.isArray(custRes.value) ? custRes.value : []);
        custs.forEach((c) => {
          if (c.status === 'Cancelled') return;
          const diff = getDiffDays(c.carData?.dueDate);
          if (diff === null) return;

          if (diff < 0) {
            result.push({
              id: `v-exp-${c.id}`,
              type: 'expired',
              category: 'Kendaraan',
              name: c.name,
              detail: `${c.carData?.carBrand || ''} ${c.carData?.carModel || ''} · ${c.carData?.plateNumber || ''}`.trim(),
              diff,
              date: c.carData?.dueDate,
            });
          } else if (diff <= 30) {
            result.push({
              id: `v-soon-${c.id}`,
              type: 'soon',
              category: 'Kendaraan',
              name: c.name,
              detail: `${c.carData?.carBrand || ''} ${c.carData?.carModel || ''} · ${c.carData?.plateNumber || ''}`.trim(),
              diff,
              date: c.carData?.dueDate,
            });
          }
        });
      }

      // ── Properti ──
      if (propRes.status === 'fulfilled') {
        const props = propRes.value?.properties || propRes.value?.data || (Array.isArray(propRes.value) ? propRes.value : []);
        props.forEach((p) => {
          if (p.status === 'Cancelled') return;
          const diff = getDiffDays(p.insuranceData?.endDate);
          if (diff === null) return;

          if (diff < 0) {
            result.push({
              id: `p-exp-${p.id}`,
              type: 'expired',
              category: 'Properti',
              name: p.ownerName,
              detail: `${p.propertyData?.propertyType || ''} · ${p.propertyData?.city || ''}`.trim(),
              diff,
              date: p.insuranceData?.endDate,
            });
          } else if (diff <= 30) {
            result.push({
              id: `p-soon-${p.id}`,
              type: 'soon',
              category: 'Properti',
              name: p.ownerName,
              detail: `${p.propertyData?.propertyType || ''} · ${p.propertyData?.city || ''}`.trim(),
              diff,
              date: p.insuranceData?.endDate,
            });
          }
        });
      }

      // Urutkan: expired dulu, lalu soon by diff asc
      result.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'expired' ? -1 : 1;
        return a.diff - b.diff;
      });

      setNotifs(result);
    } catch (e) {
      console.error('Gagal load notifikasi:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { notifs, loading, reload: load };
}

// ─── Notification Dropdown ───────────────────────────────────────────────────
function NotificationPopover({ anchorEl, open, onClose, notifs, loading }) {
  const soon   = notifs.filter(n => n.type === 'soon');
  const expired = notifs.filter(n => n.type === 'expired');

  const NotifItem = ({ item }) => {
    const isExpired = item.type === 'expired';
    const label = isExpired
      ? 'Sudah Expired'
      : item.diff === 0
        ? 'Hari ini!'
        : `${item.diff} hari lagi`;

    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: '10px',
        mx: 1,
        mb: 0.5,
        bgcolor: isExpired ? '#fff5f5' : item.diff <= 7 ? '#fffbeb' : '#f0f9ff',
        border: `1px solid ${isExpired ? '#fecaca' : item.diff <= 7 ? '#fde68a' : '#bae6fd'}`,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: isExpired ? '#fee2e2' : item.diff <= 7 ? '#fef3c7' : '#e0f2fe' },
      }}>
        {/* Avatar initial */}
        <Box sx={{
          width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
          bgcolor: isExpired ? '#ef4444' : item.diff <= 7 ? '#f59e0b' : '#2563eb',
          color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 800, fontSize: 14,
        }}>
          {item.name?.[0]?.toUpperCase() || '?'}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </Typography>
            <Chip
              label={label}
              size="small"
              sx={{
                height: 20, fontSize: 10, fontWeight: 700, flexShrink: 0,
                bgcolor: isExpired ? '#ef4444' : item.diff <= 7 ? '#f59e0b' : '#2563eb',
                color: '#fff',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 11.5, color: '#64748b', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.detail}
          </Typography>
          <Chip
            label={item.category}
            size="small"
            sx={{
              mt: 0.5, height: 18, fontSize: 10, fontWeight: 600,
              bgcolor: item.category === 'Kendaraan' ? '#dbeafe' : '#e0f2fe',
              color: item.category === 'Kendaraan' ? '#1d4ed8' : '#0369a1',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 360,
            maxHeight: 520,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Notifikasi</Typography>
          <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 0.2 }}>Polis yang perlu perhatian</Typography>
        </Box>
        {notifs.length > 0 && (
          <Chip
            label={`${notifs.length} item`}
            size="small"
            sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 11 }}
          />
        )}
      </Box>

      {/* Body — scrollable */}
      <Box sx={{ overflowY: 'auto', flex: 1, py: 1.5 }}>
        {loading ? (
          <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Memuat...</Typography>
          </Box>
        ) : notifs.length === 0 ? (
          <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
            <Box sx={{ fontSize: 36, mb: 1 }}>🎉</Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a', mb: 0.5 }}>Semua polis aman!</Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Tidak ada polis expired atau mendekati jatuh tempo</Typography>
          </Box>
        ) : (
          <>
            {/* Expired section */}
            {expired.length > 0 && (
              <>
                <Box sx={{ px: 2.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Sudah Expired ({expired.length})
                  </Typography>
                </Box>
                {expired.map(n => <NotifItem key={n.id} item={n} />)}
                {soon.length > 0 && <Divider sx={{ my: 1.5, mx: 2, borderColor: '#f1f5f9' }} />}
              </>
            )}

            {/* Soon section */}
            {soon.length > 0 && (
              <>
                <Box sx={{ px: 2.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Segera Jatuh Tempo ({soon.length})
                  </Typography>
                </Box>
                {soon.map(n => <NotifItem key={n.id} item={n} />)}
              </>
            )}
          </>
        )}
      </Box>
    </Popover>
  );
}

// ─── Bell Button ─────────────────────────────────────────────────────────────
function BellButton({ notifs, loading, sx = {} }) {
  const [anchor, setAnchor] = useState(null);
  const unread = notifs.length;

  return (
    <>
      <IconButton
        onClick={e => setAnchor(e.currentTarget)}
        sx={{
          position: 'relative',
          color: '#475569',
          bgcolor: anchor ? '#eff6ff' : 'transparent',
          border: '1px solid',
          borderColor: anchor ? '#bfdbfe' : '#e2e8f0',
          borderRadius: '10px',
          width: 40, height: 40,
          transition: 'all 0.2s',
          '&:hover': { bgcolor: '#eff6ff', borderColor: '#bfdbfe' },
          ...sx,
        }}
      >
        <Badge
          badgeContent={unread}
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#ef4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              top: -2,
              right: -2,
            }
          }}
        >
          <CustomIcon
            icon={unread > 0 ? 'heroicons:bell-alert-solid' : 'heroicons:bell'}
            sx={{ fontSize: 20, color: unread > 0 ? '#2563eb' : '#475569' }}
          />
        </Badge>
      </IconButton>

      <NotificationPopover
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        notifs={notifs}
        loading={loading}
      />
    </>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [docMenuAnchor, setDocMenuAnchor] = useState(null);
  const isDocMenuOpen = Boolean(docMenuAnchor);
  const { user, logout, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const { notifs, loading: notifLoading } = useNotifications();

  useEffect(() => {
    // Temporary bypass auth for testing
    // if (!user && !isLoading) {
    //   navigate('/login', { replace: true });
    // }
  }, [user, isLoading, navigate]);

  const sections = [
    { icon: 'heroicons:rectangle-group', label: 'Dashboard', url: '/dashboard', title: 'Dashboard' },
    { icon: 'heroicons:users', label: 'Customers', url: '/customers', title: 'Customer Management' },
    { icon: 'heroicons:building-office-2', label: 'Properties', url: '/properties', title: 'Property Management' },
    { icon: 'heroicons:calendar', label: 'Quotation', url: '/quotations/create', title: 'Create Quotation' },
    { icon: 'heroicons:document-currency-dollar', label: 'Invoice', url: '/invoices/create', title: 'Create Invoice' },
    { icon: 'heroicons:shield-check', label: 'Admin Management', url: '/admin-management', title: 'Admin Management', adminOnly: true },
    { icon: 'heroicons:document-text', label: 'Kwitansi', url: '/kwitansi', title: 'Kwitansi' },
  ];

  useEffect(() => {
    const matchedSection = sections.find(s => s.url === location.pathname);
    if (matchedSection?.title) document.title = matchedSection.title;
  }, [location.pathname]);

  const handleDrawerClose = () => setIsDrawerOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-screen max-h-screen overflow-hidden h-full">
      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { sm: Constants.NAVIGATION_DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          className="sm:hidden"
          sx={{
            '& .MuiDrawer-paper': {
              backgroundColor: 'var(--color-project-tertiary)',
              color: 'var(--color-project-grey-1)',
              boxSizing: 'border-box',
              width: Constants.NAVIGATION_DRAWER_WIDTH,
            },
          }}
        >
          <DrawerContent sections={sections} onClose={handleDrawerClose} user={user} onLogout={handleLogout} />
        </Drawer>

        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          className="hidden sm:block"
          sx={{
            '& .MuiDrawer-paper': {
              backgroundColor: 'var(--color-project-grey-5)',
              color: 'var(--color-project-grey-1)',
              boxSizing: 'border-box',
              width: Constants.NAVIGATION_DRAWER_WIDTH,
            },
          }}
          open
        >
          <DrawerContent sections={sections} onClose={handleDrawerClose} user={user} onLogout={handleLogout} />
        </Drawer>
      </Box>

      <div className="max-h-full w-full flex flex-col">
        {/* ── Mobile Toolbar ── */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            height: `${Constants.HEADER_MOBILE_HEIGHT}px`,
            bgcolor: '#fff',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <IconButton onClick={() => setIsDrawerOpen(!isDrawerOpen)} sx={{ color: '#1E293B' }}>
            <CustomIcon icon="heroicons:bars-3-solid" />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E3A8A', letterSpacing: '-0.5px' }}>
            {sections.find(s => s.url === location.pathname)?.label || 'Dashboard'}
          </Typography>

          {/* Bell + Avatar di mobile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BellButton notifs={notifs} loading={notifLoading} />
            <Avatar sx={{ width: 36, height: 36, border: '2px solid #EFF6FF' }} src={user?.avatarUrl}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </Box>
        </Box>

        {/* ── Desktop Toolbar ── */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'flex-end',
            alignItems: 'center',
            px: { xs: 4, sm: 9 },
            py: 4,
            width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` },
            ml: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` },
            height: `${Constants.HEADER_DESKTOP_HEIGHT}px`,
            gap: 2,
          }}
        >
          {/* Bell icon */}
          <BellButton notifs={notifs} loading={notifLoading} />

          {/* User info + avatar */}
          <div className="flex gap-3 items-center">
            <div className="text-lg text-right">
              <div>{user?.username || 'Demo User'}</div>
              <div className="typography-1 text-sm">{user?.role || 'user'}</div>
            </div>
            <Avatar sx={{ width: 40, height: 40 }}>
              {(user?.username?.charAt(0) || 'D')?.toUpperCase()}
            </Avatar>
          </div>
        </Box>

        {/* ── Content ── */}
        <Box
          component="main"
          sx={{
            px: { xs: 0, sm: 9 },
            py: { xs: 0, sm: 4 },
            width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` },
            marginLeft: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` },
            maxHeight: {
              xs: `calc(100vh - ${Constants.HEADER_MOBILE_HEIGHT}px - 64px)`,
              sm: `calc(100vh - ${Constants.HEADER_DESKTOP_HEIGHT}px)`,
            },
            overflow: 'auto',
            display: 'flex',
            bgcolor: '#F8FAFC',
          }}
        >
          <div className="w-full">
            <Outlet />
          </div>
        </Box>

        {/* ── Bottom Navigation Mobile ── */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '64px',
            bgcolor: '#fff',
            borderTop: '1px solid #F1F5F9',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1000,
            px: 2,
          }}
        >
          {[
            { icon: 'heroicons:home', label: 'Home', url: '/dashboard' },
            { icon: 'heroicons:users', label: 'Customers', url: '/customers' },
            { icon: 'heroicons:building-office-2', label: 'Properties', url: '/properties' },
            { icon: 'heroicons:document-text', label: 'Documents', url: '/documents', isMenu: true },
          ].map((item) => {
            const isActive = item.isMenu
              ? ['/invoices', '/quotations', '/kwitansi'].some(path => location.pathname.startsWith(path))
              : location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));

            return (
              <Box
                key={item.label}
                onClick={(e) => {
                  if (item.isMenu) setDocMenuAnchor(e.currentTarget);
                  else navigate(item.url);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  color: isActive ? '#1E3A8A' : '#94A3B8',
                  cursor: 'pointer',
                  minWidth: '64px',
                }}
              >
                <CustomIcon icon={isActive ? `${item.icon}-solid` : item.icon} sx={{ fontSize: '24px' }} />
                <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.65rem' }}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* ── Documents Menu Mobile ── */}
        <Menu
          anchorEl={docMenuAnchor}
          open={isDocMenuOpen}
          onClose={() => setDocMenuAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: '12px',
              mt: -1,
              minWidth: 150,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          <MuiMenuItem onClick={() => { navigate('/invoices/create'); setDocMenuAnchor(null); }}>
            <ListItemIcon><CustomIcon icon="heroicons:document-plus" sx={{ color: '#1E3A8A' }} /></ListItemIcon>
            <ListItemText primary="Invoice" />
          </MuiMenuItem>
          <MuiMenuItem onClick={() => { navigate('/kwitansi'); setDocMenuAnchor(null); }}>
            <ListItemIcon><CustomIcon icon="heroicons:receipt-percent" sx={{ color: '#1E3A8A' }} /></ListItemIcon>
            <ListItemText primary="Kwitansi" />
          </MuiMenuItem>
          <MuiMenuItem onClick={() => { navigate('/quotations/create'); setDocMenuAnchor(null); }}>
            <ListItemIcon><CustomIcon icon="heroicons:clipboard-document-list" sx={{ color: '#1E3A8A' }} /></ListItemIcon>
            <ListItemText primary="Quotation" />
          </MuiMenuItem>
        </Menu>
      </div>
    </div>
  );
}

// ─── DrawerContent ────────────────────────────────────────────────────────────
function DrawerContent({ sections, onClose, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const filteredSections = sections.filter(section => {
    if (section.adminOnly && user?.role !== 'superadmin') return false;
    return true;
  });

  return (
    <div className="text-project-grey-1">
      <div className="py-5 px-6">
        <Logo />
      </div>
      <div className="mt-4">
        {filteredSections.map((section) => (
          <MenuItem
            key={section.label}
            icon={section.icon}
            label={section.label}
            disabled={!Boolean(section?.url)}
            onClick={() => {
              if (section?.url) { navigate(section?.url); onClose(); }
            }}
            active={location.pathname.match(new RegExp(`.*${section.url}\/?`, 'gm'))}
          />
        ))}
        <div className="mt-4">
          <MenuItem icon="heroicons:arrow-left-end-on-rectangle" label="Logout" onClick={onLogout} />
        </div>
      </div>
    </div>
  );
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────
function MenuItem({ active, icon, label, onClick, disabled }) {
  return (
    <Button
      sx={{
        px: 4,
        py: 3,
        borderLeft: active && `4px solid var(--color-project-primary)`,
        backgroundColor: active && 'var(--color-project-secondary)',
        color: active ? 'var(--color-project-primary)' : 'var(--color-project-grey-1)',
        textTransform: 'initial',
        justifyContent: 'flex-start',
        rowGap: 2,
        borderRadius: 0,
      }}
      startIcon={<div><CustomIcon icon={icon} /></div>}
      fullWidth
      disabled={disabled}
      onClick={onClick}
    >
      <div className="font-medium text-lg text-inherit">{label}</div>
    </Button>
  );
}