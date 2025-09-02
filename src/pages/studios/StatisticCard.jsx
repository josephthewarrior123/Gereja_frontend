// StatisticCard.jsx
import { Box, Typography, Card, CardContent, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { useState } from 'react';

const StatisticCard = ({ 
  title, 
  value, 
  subtitle,
  color = 'text.primary', 
  icon,
  onClick,
  detailsComponent 
}) => {
  const [openDetails, setOpenDetails] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (detailsComponent) {
      setOpenDetails(true);
    }
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
  };

  return (
    <>
      <Card 
        sx={{ 
          minWidth: 200, 
          cursor: (onClick || detailsComponent) ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': (onClick || detailsComponent) ? {
            transform: 'translateY(-4px)',
            boxShadow: 4
          } : {}
        }}
        onClick={handleClick}
        elevation={2}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" fontWeight="bold" color={color}>
                {value}
              </Typography>
              
              {subtitle && (
                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 500,
                    ml: 1 // Menambahkan margin kiri agar tidak terlalu mepet
                  }}
                >
                  ({subtitle})
                </Typography>
              )}
            </Box>
            
            {icon && (
              <IconButton size="small" disabled sx={{ color: color }}>
                <Icon icon={icon} width={24} height={24} />
              </IconButton>
            )}
          </Box>

          {(onClick || detailsComponent) && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Click for details
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {detailsComponent && React.cloneElement(detailsComponent, {
        open: openDetails,
        onClose: handleCloseDetails
      })}
    </>
  );
};

export default StatisticCard;