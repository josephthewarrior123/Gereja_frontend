import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Constants from '../../utils/Constants';
import CustomIcon from '../CustomIcon';
import { useUser } from '../../hooks/UserProvider';

export default function DashboardLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && !isLoading) navigate('/login', { replace: true });
  }, [user, isLoading, navigate]);

  const sections = useMemo(
    () => [
      { icon: 'heroicons:rectangle-group', label: 'Dashboard', url: '/dashboard', title: 'Dashboard' },
      { icon: 'heroicons:book-open', label: 'Journal', url: '/journal', title: 'Journal' },
      { icon: 'heroicons:users', label: 'Users', url: '/users', title: 'User Management', adminOnly: true },
      { icon: 'heroicons:user-group', label: 'Groups', url: '/group', title: 'Group Management', adminOnly: true },
      { icon: 'heroicons:shield-check', label: 'Admin Management', url: '/admin-management', title: 'Admin Management', superAdminOnly: true },
    ],
    []
  );

  useEffect(() => {
    const matched = sections.find((s) => s.url === location.pathname);
    if (matched?.title) document.title = matched.title;
  }, [location.pathname, sections]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentSection = sections.find(
    (s) => s.url === location.pathname || (s.url !== '/' && location.pathname.startsWith(s.url))
  );
  const pageLabel = currentSection?.label || 'Dashboard';

  const isUsersPage = location.pathname === '/users';
  const canCreateUser = user?.role === 'admin' || user?.role === 'super_admin';

  // Mobile bottom nav right item logic
  // Priority: Groups (if admin) → Users → Journal
  const getMobileRightItem = () => {
    const isOnUsersArea = location.pathname.startsWith('/users');
    const isOnGroupsArea = location.pathname.startsWith('/groups');

    if (!canCreateUser) {
      return { icon: 'heroicons:book-open', label: 'Journal', url: '/journal' };
    }
    if (isOnUsersArea) {
      return { icon: 'heroicons:user-group', label: 'Groups', url: '/groups' };
    }
    if (isOnGroupsArea) {
      return { icon: 'heroicons:users', label: 'Users', url: '/users' };
    }
    return { icon: 'heroicons:users', label: 'Users', url: '/users' };
  };

  const mobileRightItem = getMobileRightItem();

  return (
    <div className="max-w-screen max-h-screen overflow-hidden h-full">
      <Box component="nav" sx={{ width: { sm: Constants.NAVIGATION_DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          className="sm:hidden"
          sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: Constants.NAVIGATION_DRAWER_WIDTH, border: 'none' } }}
        >
          <DrawerContent sections={sections} onClose={() => setIsDrawerOpen(false)} user={user} onLogout={handleLogout} />
        </Drawer>
        <Drawer
          variant="permanent"
          className="hidden sm:block"
          open
          sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: Constants.NAVIGATION_DRAWER_WIDTH, border: 'none', borderRight: '1px solid #f1f5f9' } }}
        >
          <DrawerContent sections={sections} onClose={() => setIsDrawerOpen(false)} user={user} onLogout={handleLogout} />
        </Drawer>
      </Box>

      <div className="max-h-full w-full flex flex-col">

        {/* ===== MOBILE HEADER ===== */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            height: `${Constants.HEADER_MOBILE_HEIGHT}px`,
            bgcolor: '#fff',
            borderBottom: '1px solid #f1f5f9',
            position: 'relative',
          }}
        >
          <IconButton onClick={() => setIsDrawerOpen(true)} sx={{ color: '#334155' }}>
            <CustomIcon icon="heroicons:bars-3-solid" />
          </IconButton>

          <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: 16, whiteSpace: 'nowrap' }}>
              {pageLabel}
            </Typography>
          </Box>

          <Avatar sx={{ width: 32, height: 32, bgcolor: '#2563eb', fontSize: 13, fontWeight: 700 }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
        </Box>

        {/* ===== DESKTOP HEADER ===== */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'flex-end',
            alignItems: 'center',
            px: 5,
            width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` },
            ml: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` },
            height: `${Constants.HEADER_DESKTOP_HEIGHT}px`,
            gap: 2,
            borderBottom: '1px solid #f1f5f9',
            bgcolor: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user?.username || 'Demo User'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role || 'user'}</div>
            </div>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#2563eb', fontSize: 13, fontWeight: 700 }}>
              {(user?.username?.charAt(0) || 'D')?.toUpperCase()}
            </Avatar>
          </div>
        </Box>

        {/* ===== MAIN CONTENT ===== */}
        <Box
          component="main"
          sx={{
            px: { xs: 0, sm: 5 },
            py: { xs: 0, sm: 4 },
            width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` },
            marginLeft: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` },
            maxHeight: { xs: `calc(100vh - ${Constants.HEADER_MOBILE_HEIGHT}px - 60px)`, sm: `calc(100vh - ${Constants.HEADER_DESKTOP_HEIGHT}px)` },
            overflow: 'auto',
            bgcolor: '#f8fafc',
          }}
        >
          <div className="w-full">
            <Outlet />
          </div>
        </Box>

        {/* ===== MOBILE BOTTOM NAV ===== */}
        <Box
          sx={{
            display: { xs: 'block', sm: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        >
          {/* SVG notch background */}
          <svg
            style={{ display: 'block', width: '100%', position: 'absolute', bottom: 0, left: 0 }}
            height="60"
            viewBox="0 0 375 60"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 
                 L155,0 
                 Q172,0 175,10 
                 Q187.5,44 200,10 
                 Q203,0 220,0 
                 L375,0 
                 L375,60 L0,60 Z"
              fill="white"
            />
            <path
              d="M0,0 
                 L155,0 
                 Q172,0 175,10 
                 Q187.5,44 200,10 
                 Q203,0 220,0 
                 L375,0"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          </svg>

          {/* Nav items row */}
          <Box
            sx={{
              position: 'relative',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}
          >
            {/* Left: Dashboard */}
            {(() => {
              const item = { icon: 'heroicons:home', label: 'Dashboard', url: '/dashboard' };
              const isActive = location.pathname === item.url || location.pathname.startsWith(item.url);
              return (
                <Box
                  onClick={() => navigate(item.url)}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, color: isActive ? '#2563eb' : '#94a3b8', cursor: 'pointer', minWidth: '80px', zIndex: 1 }}
                >
                  <CustomIcon icon={isActive ? `${item.icon}-solid` : item.icon} sx={{ fontSize: '22px' }} />
                  <Typography variant="caption" sx={{ fontWeight: isActive ? 600 : 400, fontSize: '0.6rem' }}>{item.label}</Typography>
                </Box>
              );
            })()}

            {/* Center: FAB */}
            {canCreateUser ? (
              <Box
                onClick={() => navigate('/users/create')}
                sx={{
                  width: 56, height: 56,
                  borderRadius: '50%',
                  bgcolor: '#1E3A8A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(30,58,138,0.5)',
                  position: 'absolute',
                  bottom: '18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#1e40af' },
                  '&:active': { transform: 'translateX(-50%) scale(0.93)' },
                }}
              >
                <CustomIcon icon="heroicons:plus-solid" sx={{ fontSize: 28, color: '#ffffff !important' }} style={{ color: '#ffffff' }} />
              </Box>
            ) : (
              <Box sx={{ width: 56 }} />
            )}

            {/* Right: dynamic — Groups / Users / Journal */}
            {(() => {
              const isActive = location.pathname === mobileRightItem.url || location.pathname.startsWith(mobileRightItem.url);
              return (
                <Box
                  onClick={() => navigate(mobileRightItem.url)}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, color: isActive ? '#2563eb' : '#94a3b8', cursor: 'pointer', minWidth: '80px', zIndex: 1 }}
                >
                  <CustomIcon icon={isActive ? `${mobileRightItem.icon}-solid` : mobileRightItem.icon} sx={{ fontSize: '22px' }} />
                  <Typography variant="caption" sx={{ fontWeight: isActive ? 600 : 400, fontSize: '0.6rem' }}>{mobileRightItem.label}</Typography>
                </Box>
              );
            })()}
          </Box>
        </Box>
      </div>
    </div>
  );
}

function DrawerContent({ sections, onClose, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const filteredSections = sections.filter((s) => {
    if (s.superAdminOnly) return user?.role === 'super_admin';
    if (s.adminOnly) return user?.role === 'admin' || user?.role === 'super_admin';
    return true;
  });
  const mainNav = filteredSections.filter((s) => !s.adminOnly && !s.superAdminOnly);
  const adminNav = filteredSections.filter((s) => s.adminOnly || s.superAdminOnly);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9a12.02 12.02 0 00-.382-3.016A11.955 11.955 0 0112 2.944z" fill="white" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', letterSpacing: '-0.3px' }}>Asuransi</span>
        </div>
      </div>

      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username || 'Demo User'}</div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role || 'user'}</div>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 0' }}>
        <NavGroup label="Main">
          {mainNav.map((s) => (
            <NavItem key={s.label} section={s} location={location} navigate={navigate} onClose={onClose} />
          ))}
        </NavGroup>
        {adminNav.length > 0 && (
          <NavGroup label="Admin">
            {adminNav.map((s) => (
              <NavItem key={s.label} section={s} location={location} navigate={navigate} onClose={onClose} />
            ))}
          </NavGroup>
        )}
      </div>

      <div style={{ padding: '8px 10px 20px' }}>
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 6 }} />
        <button
          onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.12s' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff1f2';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <CustomIcon icon="heroicons:arrow-left-end-on-rectangle" sx={{ fontSize: 16, color: 'inherit' }} />
          <span style={{ fontSize: 13, fontWeight: 400 }}>Logout</span>
        </button>
      </div>
    </div>
  );
}

function NavGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

function NavItem({ section, location, navigate, onClose }) {
  const isActive = location.pathname === section.url || (section.url !== '/' && location.pathname.startsWith(section.url));
  return (
    <button
      onClick={() => {
        navigate(section.url);
        onClose();
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        marginBottom: 2,
        borderRadius: 8,
        border: 'none',
        background: isActive ? '#eff6ff' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.12s',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = '#f8fafc';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <CustomIcon icon={section.icon} sx={{ fontSize: 16, color: isActive ? '#2563eb' : '#94a3b8', flexShrink: 0 }} />
      <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, color: isActive ? '#1d4ed8' : '#64748b', flex: 1 }}>{section.label}</span>
      {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
    </button>
  );
}