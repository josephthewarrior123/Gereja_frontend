import Button from '@mui/material/Button';

export default function CustomButton({
    children,
    onClick,
    disabled,
    variant = 'contained',
    sx,
    ...props
}) {
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            variant={variant}
            sx={{
                px: 3, // Lebar padding dikurangi
                py: 3, // Tinggi padding dikurangi
                fontSize: 14, // Ukuran font lebih kecil
                borderRadius: '6px', // Sedikit lebih kecil radiusnya
                textTransform: 'initial',
                minWidth: '80px', // Lebar minimal tombol
                height: '45px', // Tinggi tombol lebih kecil
                '&.Mui-disabled': {
                    backgroundColor: 'var(--color-project-grey-2)',
                    color: 'var(--color-project-grey-3)',
                    cursor: 'not-allowed',
                },
                ...sx,
            }}
            {...props}
        >
            {children}
        </Button>
    );
}
