import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';

export default function CustomSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  children,
  error = false,
  helperText,
  fullWidth = true,
  size = 'medium',
  ...props
}) {
  const labelId = `${name}-label`;

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      size={size}
      variant="outlined"
    >
      {label && (
        <InputLabel id={labelId} shrink>
          {label}
        </InputLabel>
      )}

      <Select
        labelId={labelId}
        name={name}
        value={value ?? ''}
        label={label}
        onChange={onChange}
        onBlur={onBlur}
        MenuProps={{
          disablePortal: false,
          PaperProps: {
            sx: {
              zIndex: 1500,
            },
          },
        }}
        sx={{
          '& .MuiSelect-select': {
            py: size === 'small' ? 1.5 : 2,
            px: 2,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: 2,
          },
        }}
        {...props}
      >
        {children}
      </Select>

      {helperText && (
        <FormHelperText>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
