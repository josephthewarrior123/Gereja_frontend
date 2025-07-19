import { Icon } from '@iconify/react';

export default function CustomIcon({ icon, size = 20, color }) {
    return (
        <Icon
            icon={icon}
            height={size}
            width={20}
            color="inherit"
        />
    );
}
