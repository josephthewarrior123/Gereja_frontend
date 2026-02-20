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
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Constants from '../../utils/Constants';
import CustomIcon from '../CustomIcon';
import Logo from '../Logo';
import { useUser } from '../../hooks/UserProvider';

export default function DashboardLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [docMenuAnchor, setDocMenuAnchor] = useState(null);
  const isDocMenuOpen = Boolean(docMenuAnchor);
  const { user, logout, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Temporary bypass auth for testing
    // if (!user && !isLoading) {
    //   navigate('/login', { replace: true });
    // }
  }, [user, isLoading, navigate]);

  const sections = [
    {
      icon: 'heroicons:rectangle-group',
      label: 'Dashboard',
      title: 'Dashboard',
    },
    {
      icon: 'heroicons:users',
      label: 'Customers',
      url: '/customers',
      title: 'Customer Management',
    },
    {
      icon: 'heroicons:building-office-2',
      label: 'Properties',
      url: '/properties',
      title: 'Property Management',
    },

    { icon: 'heroicons:calendar', label: 'Quotation', url: '/quotations/create', title: 'Create Quotation' },
    { icon: 'heroicons:document-currency-dollar', label: 'Invoice', url: '/invoices/create', title: 'Create Invoice' },
    {
      icon: 'heroicons:shield-check',
      label: 'Admin Management',
      url: '/admin-management',
      title: 'Admin Management',
      adminOnly: true
    },
    {
      icon: 'heroicons:document-text',
      label: 'Kwitansi',
      url: '/kwitansi',
      title: 'Kwitansi',
    }
  ];

  // Update document title based on route
  useEffect(() => {
    const matchedSection = sections.find(
      (section) => section.url === location.pathname
    );
    const pageTitle = matchedSection ? matchedSection.title : '';
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [location.pathname]);

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Comment out loading check for now
  // if (isLoading) {
  //   return <div className="flex items-center justify-center h-screen">Loading...</div>;
  // }

  return (
    <div className="max-w-screen max-h-screen overflow-hidden h-full">
      {/* Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: Constants.NAVIGATION_DRAWER_WIDTH },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
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
          <DrawerContent
            sections={sections}
            onClose={handleDrawerClose}
            user={user}
            onLogout={handleLogout}
          />
        </Drawer>

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
          <DrawerContent
            sections={sections}
            onClose={handleDrawerClose}
            user={user}
            onLogout={handleLogout}
          />
        </Drawer>
      </Box>

      <div className="max-h-full w-full flex flex-col">
        {/* Mobile Toolbar */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            height: `${Constants.HEADER_MOBILE_HEIGHT}px`,
            bgcolor: '#fff',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <IconButton
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            sx={{ color: '#1E293B' }}
          >
            <CustomIcon icon={'heroicons:bars-3-solid'} />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E3A8A', letterSpacing: '-0.5px' }}>
            {sections.find(s => s.url === location.pathname)?.label || 'Dashboard'}
          </Typography>

          <Avatar
            sx={{ width: 36, height: 36, border: '2px solid #EFF6FF' }}
            src={user?.avatarUrl}
          >
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
        </Box>

        {/* Desktop Toolbar */}
        <Box
          sx={{
            display: {
              xs: 'none',
              sm: 'flex',
            },
            justifyContent: 'flex-end',
            alignItems: 'center',
            px: {
              xs: 4,
              sm: 9,
            },
            py: 4,
            width: {
              sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)`,
            },
            ml: {
              sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px`,
            },
            height: `${Constants.HEADER_DESKTOP_HEIGHT}px`,
          }}
        >
          <div className="flex gap-3 items-center">
            <div className="text-lg text-right">
              <div>{user?.username || 'Demo User'}</div>
              <div className="typography-1 text-sm">
                {user?.role || 'user'}
              </div>
            </div>
            <Avatar sx={{ width: 40, height: 40 }}>
              {(user?.username?.charAt(0) || 'D')?.toUpperCase()}
            </Avatar>
          </div>
        </Box>

        {/* Content */}
        <Box
          component="main"
          sx={{
            px: {
              xs: 0, // No padding on mobile for full-width items if needed
              sm: 9,
            },
            py: {
              xs: 0,
              sm: 4
            },
            width: {
              sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)`,
            },
            marginLeft: {
              sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px`,
            },
            maxHeight: {
              xs: `calc(100vh - ${Constants.HEADER_MOBILE_HEIGHT}px - 64px)`, // Subtract bottom nav height
              sm: `calc(100vh - ${Constants.HEADER_DESKTOP_HEIGHT}px)`,
            },
            overflow: 'auto',
            display: 'flex',
            bgcolor: '#F8FAFC'
          }}
        >
          <div className="w-full">
            <Outlet />
          </div>
        </Box>

        {/* Bottom Navigation for Mobile */}
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
            px: 2
          }}
        >
          {[
            { icon: 'heroicons:home', label: 'Home', url: '/' },
            { icon: 'heroicons:users', label: 'Customers', url: '/customers' },
            { icon: 'heroicons:building-office-2', label: 'Properties', url: '/properties' },
            { icon: 'heroicons:document-text', label: 'Documents', url: '/documents', isMenu: true }
          ].map((item) => {
            const isActive = item.isMenu
              ? ['/invoices', '/quotations', '/kwitansi'].some(path => location.pathname.startsWith(path))
              : location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));

            return (
              <Box
                key={item.label}
                onClick={(e) => {
                  if (item.isMenu) {
                    setDocMenuAnchor(e.currentTarget);
                  } else {
                    navigate(item.url);
                  }
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  color: isActive ? '#1E3A8A' : '#94A3B8',
                  cursor: 'pointer',
                  minWidth: '64px'
                }}
              >
                <CustomIcon icon={isActive ? `${item.icon}-solid` : item.icon} sx={{ fontSize: '24px' }} />
                <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.65rem' }}>{item.label}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* Documents Menu for Mobile */}
        <Menu
          anchorEl={docMenuAnchor}
          open={isDocMenuOpen}
          onClose={() => setDocMenuAnchor(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: '12px',
              mt: -1,
              minWidth: 150,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }
          }}
        >
          <MuiMenuItem
            onClick={() => {
              navigate('/invoices/create');
              setDocMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <CustomIcon icon="heroicons:document-plus" sx={{ color: '#1E3A8A' }} />
            </ListItemIcon>
            <ListItemText primary="Invoice" />
          </MuiMenuItem>
          <MuiMenuItem
            onClick={() => {
              navigate('/kwitansi');
              setDocMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <CustomIcon icon="heroicons:receipt-percent" sx={{ color: '#1E3A8A' }} />
            </ListItemIcon>
            <ListItemText primary="Kwitansi" />
          </MuiMenuItem>
          <MuiMenuItem
            onClick={() => {
              navigate('/quotations/create');
              setDocMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <CustomIcon icon="heroicons:clipboard-document-list" sx={{ color: '#1E3A8A' }} />
            </ListItemIcon>
            <ListItemText primary="Quotation" />
          </MuiMenuItem>
        </Menu>
      </div>
    </div>
  );
}

function DrawerContent({ sections, onClose, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Filter menu items based on user role
  const filteredSections = sections.filter(section => {
    if (section.adminOnly && user?.role !== 'superadmin') {
      return false;
    }
    return true;
  });

  return (
    <div className="text-project-grey-1">
      {/* Logo */}
      <div className="py-5 px-6">
        <Logo />
      </div>

      {/* Sections */}
      <div className="mt-4">
        {filteredSections.map((section) => (
          <MenuItem
            key={section.label}
            icon={section.icon}
            label={section.label}
            disabled={!Boolean(section?.url)}
            onClick={() => {
              if (section?.url) {
                navigate(section?.url);
                onClose();
              }
            }}
            active={location.pathname.match(
              new RegExp(`.*${section.url}\/?`, 'gm')
            )}
          />
        ))}

        <div className="mt-4">
          <MenuItem
            icon={'heroicons:arrow-left-end-on-rectangle'}
            label={'Logout'}
            onClick={onLogout}
          />
        </div>
      </div>
    </div>
  );
}

function MenuItem({ active, icon, label, onClick, disabled }) {
  return (
    <Button
      sx={{
        px: 4,
        py: 3,
        borderLeft: active && `4px solid var(--color-project-primary)`,
        backgroundColor: active && 'var(--color-project-secondary)',
        color: active
          ? 'var(--color-project-primary)'
          : 'var(--color-project-grey-1)',
        textTransform: 'initial',
        justifyContent: 'flex-start',
        rowGap: 2,
        borderRadius: 0,
      }}
      startIcon={
        <div>
          <CustomIcon icon={icon} />
        </div>
      }
      fullWidth
      disabled={disabled}
      onClick={onClick}
    >
      <div className="font-medium text-lg text-inherit">{label}</div>
    </Button>
  );
}