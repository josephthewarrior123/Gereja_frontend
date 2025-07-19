import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';

export default function CustomSelect({
    label,
    children,
    value,
    onChange,
    className,
    options,
    error,
    helperText,
    fullWidth,
    name,
    ...props
}) {
    return (
        <div>
            <div className="mb-2">
                <label className="typography-1">{label}</label>
            </div>
            <FormControl sx={{ width: fullWidth && '100%' }} error={error}>
                <Select
                    name={name}
                    sx={{
                        '& .MuiSelect-select': { py: 3, px: 4 },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderRadius: 2,
                            border: `1px solid var(--color-project-tertiary)`,
                        },
                        width: '100%',
                    }}
                    value={value}
                    onChange={onChange}
                    className={className}
                    {...props}
                >
                    {children}
                </Select>
                {helperText && (
                    <FormHelperText
                        sx={{
                            '&.MuiFormHelperText-root': {
                                marginLeft: 0,
                                marginRight: 0,
                                marginTop: 2,
                            },
                        }}
                    >
                        {helperText}
                    </FormHelperText>
                )}
            </FormControl>
        </div>
    );
}
