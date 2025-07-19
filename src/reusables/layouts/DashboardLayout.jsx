import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Constants from '../../utils/Constants';
import CustomIcon from '../CustomIcon';
import Logo from '../Logo';

// Mock user data for development
const mockUser = {
  token: 'dev-token',
  data: {
    username: 'Admin',
    premiers: {
      name: 'Mock Premiere',
      cinemas: {
        name: 'Mock Cinema',
        address: '123 Developer Street',
        id: 1
      },
      id: 1
    }
  }
};

export default function DashboardLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const user = mockUser; // Using mock user instead of useUser()

  const sections = [
    {
      icon: 'heroicons:rectangle-group',
      label: 'Dashboard',
      title: 'Dashboard',
    },
    {
      icon: 'heroicons:users',
      label: 'Guests',
      url: '/guests',
      title: 'Guests List',
    },
    {
      icon: 'fluent-emoji-high-contrast:film-projector',
      label: 'Couple',
      url: '/couples',
      title: 'Couple',
    },
    {
      icon: 'ic:round-qr-code',
      label: 'QR Scan',
      url: '/qr-scan',
      title: 'QR Scan',
    },
  ];

  const PageTitle = () => {
    const location = useLocation();
    const matchedSection = sections.find(
      (section) => section.url === location.pathname
    );
    const pageTitle = matchedSection ? matchedSection.title : '';
    
    useEffect(() => {
      document.title = pageTitle;
    }, [location.pathname, pageTitle]);

    return <h1 className="text-2xl">{pageTitle}</h1>;
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

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
            p: 4,
            height: `${Constants.HEADER_MOBILE_HEIGHT}px`,
          }}
        >
          <IconButton
            sx={{ p: '10px' }}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          >
            <CustomIcon icon={'heroicons:bars-3-solid'} />
          </IconButton>
          <div>
            <Logo />
          </div>
          <div>
            <Avatar sx={{ width: 40, height: 40 }}>
              {user?.data?.username?.charAt(0)?.toUpperCase()}
            </Avatar>
          </div>
        </Box>

        {/* Desktop Toolbar */}
        <Box
          sx={{
            display: {
              xs: 'none',
              sm: 'flex',
            },
            justifyContent: 'space-between',
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
          <div>
            <PageTitle />
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-lg text-right">
              <div>{user?.data?.username}</div>
              <div className="typography-1 text-sm">
                {user?.data?.premiers?.name}
              </div>
            </div>
            <Avatar sx={{ width: 40, height: 40 }}>
              {user?.data?.username?.charAt(0)?.toUpperCase()}
            </Avatar>
          </div>
        </Box>

        {/* Content */}
        <Box
          component="main"
          sx={{
            px: {
              xs: 4,
              sm: 9,
            },
            py: 4,
            width: {
              sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)`,
            },
            marginLeft: {
              sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px`,
            },
            maxHeight: {
              xs: `calc(100% - ${Constants.HEADER_MOBILE_HEIGHT}px)`,
              sm: `calc(100% - ${Constants.HEADER_DESKTOP_HEIGHT}px)`,
            },
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div className="w-full">
            <Outlet />
          </div>
        </Box>
      </div>
    </div>
  );
}

function DrawerContent({ sections, onClose, user }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="text-project-grey-1">
      {/* Logo */}
      <div className="py-5 px-6">
        <Logo />
      </div>

      {/* Sections */}
      <div className="mt-4">
        {sections.map((section) => (
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
            onClick={() => {
              navigate('/');
            }}
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