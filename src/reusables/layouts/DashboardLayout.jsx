// src/reusables/layouts/DashboardLayout.jsx
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Constants from '../../utils/Constants';
import CustomIcon from '../CustomIcon';
import { useUser } from '../../hooks/UserProvider';

// ─── tokens ───────────────────────────────────────────────────────────────────
const ACCENT = '#6366f1';
const ACCENT_DARK = '#4f46e5';

// ─── Role pill ────────────────────────────────────────────────────────────────
const ROLE_CFG = {
  super_admin: { label: 'Super Admin', color: '#7c3aed', bg: '#f5f3ff' },
  admin: { label: 'Admin', color: '#1d4ed8', bg: '#eff6ff' },
  user: { label: 'User', color: '#0f766e', bg: '#f0fdfa' },
};
function RolePill({ role }) {
  const cfg = ROLE_CFG[role] || { label: role, color: '#64748b', bg: '#f8fafc' };
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 99,
      fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}22`,
      fontFamily: '"DM Sans", sans-serif',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Sidebar NavGroup ─────────────────────────────────────────────────────────
function NavGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9.5, fontWeight: 700, color: '#cbd5e1',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        padding: '0 10px', marginBottom: 4,
        fontFamily: '"DM Sans", sans-serif',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Sidebar NavItem ──────────────────────────────────────────────────────────
function NavItem({ section, location, navigate, onClose }) {
  const isActive = location.pathname === section.url ||
    (section.url !== '/' && location.pathname.startsWith(section.url));
  return (
    <button
      onClick={() => { navigate(section.url); onClose(); }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', marginBottom: 2, borderRadius: 10, border: 'none',
        background: isActive ? `${ACCENT}12` : 'transparent',
        cursor: 'pointer', transition: 'background .12s', textAlign: 'left',
        position: 'relative',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: 3, borderRadius: '0 3px 3px 0',
          background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT_DARK})`,
        }} />
      )}
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? `${ACCENT}18` : 'transparent',
        transition: 'background .12s',
      }}>
        <CustomIcon icon={section.icon} sx={{ fontSize: 17, color: isActive ? ACCENT : '#94a3b8' }} />
      </div>
      <span style={{
        fontSize: 13.5, fontWeight: isActive ? 600 : 400,
        color: isActive ? ACCENT_DARK : '#64748b',
        flex: 1, fontFamily: '"DM Sans", sans-serif',
      }}>
        {section.label}
      </span>
      {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />}
    </button>
  );
}

// ─── Drawer Content ───────────────────────────────────────────────────────────
function DrawerContent({ sections, onClose, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const filtered = sections.filter((s) => {
    if (s.superAdminOnly) return user?.role === 'super_admin';
    if (s.adminOnly) return user?.role === 'admin' || user?.role === 'super_admin';
    if (s.adminAndSuperAdminOnly) return user?.role === 'admin' || user?.role === 'super_admin';
    return true;
  });

  const mainNav = filtered.filter((s) => !s.adminOnly && !s.superAdminOnly && !s.adminAndSuperAdminOnly);
  const privilegedNav = filtered.filter((s) => s.adminOnly || s.superAdminOnly || s.adminAndSuperAdminOnly);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* user card */}
      <div style={{ padding: '12px 14px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 12,
          background: '#f8fafc', border: '1px solid #f1f5f9',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, fontFamily: '"Outfit", sans-serif',
            boxShadow: `0 2px 6px ${ACCENT}33`,
          }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#0f172a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: '"DM Sans", sans-serif', marginBottom: 2,
            }}>
              {user?.username || 'Demo User'}
            </div>
            <RolePill role={user?.role} />
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 0 2px #fff' }} />
        </div>
      </div>

      {/* nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 0' }}>
        <NavGroup label="Main">
          {mainNav.map((s) => <NavItem key={s.label} section={s} location={location} navigate={navigate} onClose={onClose} />)}
        </NavGroup>
        {privilegedNav.length > 0 && (
          <NavGroup label="Admin">
            {privilegedNav.map((s) => <NavItem key={s.label} section={s} location={location} navigate={navigate} onClose={onClose} />)}
          </NavGroup>
        )}
      </div>

      {/* logout */}
      <div style={{ padding: '8px 10px 22px' }}>
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 8 }} />
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#94a3b8',
            transition: 'all .12s', fontFamily: '"DM Sans", sans-serif',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CustomIcon icon="heroicons:arrow-left-end-on-rectangle" sx={{ fontSize: 17, color: 'inherit' }} />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 400 }}>Logout</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegularUser = user?.role === 'user';

  const sections = useMemo(() => [
    { icon: 'heroicons:book-open', label: 'Journal', url: '/journal', title: 'Journal' },
    { icon: 'heroicons:trophy', label: 'Leaderboard', url: '/leaderboard', title: 'Leaderboard' },
    { icon: 'heroicons:users', label: 'Users', url: '/users', title: 'User Management', adminOnly: true },
    { icon: 'heroicons:user-group', label: 'Groups', url: '/group', title: 'Group Management', adminOnly: true },
  ], []);

  useEffect(() => {
    if (!user && !isLoading) { navigate('/login', { replace: true }); return; }
    if (user && isRegularUser && location.pathname === '/dashboard') navigate('/journal', { replace: true });
  }, [user, isLoading, navigate, isRegularUser, location.pathname]);

  // FIX: Close drawer on route change (handles case where nav doesn't trigger onClose)
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const matched = sections.find((s) => s.url === location.pathname);
    if (matched?.title) document.title = matched.title;
  }, [location.pathname, sections]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentSection = sections.find(
    (s) => s.url === location.pathname || (s.url !== '/' && location.pathname.startsWith(s.url))
  );
  const pageLabel = currentSection?.label || 'Dashboard';

  const mobileNavItems = sections.filter((s) => {
    if (s.superAdminOnly) return user?.role === 'super_admin';
    if (s.adminOnly) return user?.role === 'admin' || user?.role === 'super_admin';
    if (s.adminAndSuperAdminOnly) return user?.role === 'admin' || user?.role === 'super_admin';
    return true;
  });

  const BOTTOM_NAV_H = 64;

  return (
    <div className="max-w-screen max-h-screen overflow-hidden h-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* sidebar */}
      <Box component="nav" sx={{ width: { sm: Constants.NAVIGATION_DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        {/* FIX: keepMounted false so backdrop is properly unmounted, disableScrollLock prevents body scroll lock issues */}
        <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          ModalProps={{ keepMounted: false, disableScrollLock: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: Constants.NAVIGATION_DRAWER_WIDTH, border: 'none' }
          }}
        >
          <DrawerContent sections={sections} onClose={() => setIsDrawerOpen(false)} user={user} onLogout={handleLogout} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: Constants.NAVIGATION_DRAWER_WIDTH, border: 'none', borderRight: '1px solid #f1f5f9' }
          }}
        >
          <DrawerContent sections={sections} onClose={() => setIsDrawerOpen(false)} user={user} onLogout={handleLogout} />
        </Drawer>
      </Box>

      <div className="max-h-full w-full flex flex-col">

        {/* mobile header */}
        <Box sx={{
          display: { xs: 'flex', sm: 'none' },
          justifyContent: 'space-between', alignItems: 'center',
          px: 2, height: `${Constants.HEADER_MOBILE_HEIGHT}px`,
          bgcolor: '#fff', borderBottom: '1px solid #f1f5f9', position: 'relative',
          // FIX: ensure header is above drawer backdrop
          zIndex: 1,
        }}>
          <IconButton onClick={() => setIsDrawerOpen(true)} sx={{ color: '#334155', borderRadius: '10px' }}>
            <CustomIcon icon="heroicons:bars-3-solid" />
          </IconButton>
          <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: 15, whiteSpace: 'nowrap', fontFamily: '"Outfit", sans-serif' }}>
              {pageLabel}
            </Typography>
          </Box>
          <Box sx={{
            width: 32, height: 32, borderRadius: '9px',
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
            fontFamily: '"Outfit", sans-serif',
            boxShadow: `0 2px 6px ${ACCENT}44`,
          }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Box>
        </Box>

        {/* desktop header */}
        <Box sx={{
          display: { xs: 'none', sm: 'flex' },
          justifyContent: 'flex-end', alignItems: 'center',
          px: 5,
          width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` },
          ml: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` },
          height: `${Constants.HEADER_DESKTOP_HEIGHT}px`,
          gap: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: '"DM Sans", sans-serif' }}>
                {user?.username || 'Demo User'}
              </div>
              <div style={{ marginTop: 2 }}><RolePill role={user?.role} /></div>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, fontFamily: '"Outfit", sans-serif',
              boxShadow: `0 2px 8px ${ACCENT}44`,
            }}>
              {(user?.username?.charAt(0) || 'D')?.toUpperCase()}
            </div>
          </div>
        </Box>

        {/* main content */}
        <Box component="main" sx={{
          px: { xs: 0, sm: 5 },
          py: { xs: 0, sm: 4 },
          width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` },
          marginLeft: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` },
          maxHeight: {
            xs: `calc(100vh - ${Constants.HEADER_MOBILE_HEIGHT}px - ${BOTTOM_NAV_H}px)`,
            sm: `calc(100vh - ${Constants.HEADER_DESKTOP_HEIGHT}px)`,
          },
          overflow: 'auto',
          bgcolor: '#f8fafc',
        }}>
          <div className="w-full"><Outlet /></div>
        </Box>

        {/* ── Mobile Bottom Nav ── */}
        <Box sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: `${BOTTOM_NAV_H}px`,
          bgcolor: '#fff',
          borderTop: '1px solid #f1f5f9',
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 1,
          zIndex: 1000,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}>
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.url ||
              (item.url !== '/' && location.pathname.startsWith(item.url));
            return (
              <Box
                key={item.url}
                onClick={() => navigate(item.url)}
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 0.4, cursor: 'pointer', flex: 1, py: 1,
                  position: 'relative',
                  transition: 'opacity .15s',
                  '&:active': { opacity: 0.7 },
                }}
              >
                {isActive && (
                  <Box sx={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 28, height: 3, borderRadius: '0 0 4px 4px',
                    background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DARK})`,
                  }} />
                )}
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isActive ? `${ACCENT}14` : 'transparent',
                  transition: 'background .15s',
                }}>
                  <CustomIcon
                    icon={isActive ? `${item.icon}-solid` : item.icon}
                    sx={{ fontSize: '20px', color: isActive ? ACCENT : '#94a3b8' }}
                  />
                </Box>
                <Typography sx={{
                  fontSize: '0.58rem', fontWeight: isActive ? 700 : 400,
                  color: isActive ? ACCENT : '#94a3b8',
                  fontFamily: '"DM Sans", sans-serif',
                  lineHeight: 1,
                }}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

      </div>
    </div>
  );
}