import TextField from '@mui/material/TextField';
import CustomIcon from './CustomIcon';

export default function CustomTextInput({
    value,
    onChange, 
    searchIcon = false,
    label,
    ...props
}) {
    return (
        <div>
            <div className="mb-2">
                <label className="typography-1">{label}</label>
            </div>
            <TextField
                value={value}
                onChange={onChange} 
                sx={{
                    '& .MuiInputBase-input': { py: 3, px: 4 },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: 2,
                        border: `1px solid var(--color-project-tertiary)`,
                        px: 0
                    },
                    '& .MuiFormHelperText-root': {
                        marginLeft: 0,
                        marginRight: 0,
                        marginTop: 2,
                    },
                }}
                slotProps={{
                    input: {
                        startAdornment: searchIcon && (
                            <CustomIcon
                                icon={'heroicons:magnifying-glass-solid'}
                            />
                        ),
                    },
                }}
                label={''}
                {...props} 
            />
        </div>
    );
}