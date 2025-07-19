import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function CustomRadioGroup({ label, props, options, onChange }) {
    return (
        <div>
            <div className="mb-4">
                <label className="typography-1">{label}</label>
            </div>
            <RadioGroup
                onChange={onChange}
                {...props}
                sx={{ '&.MuiFormGroup-root': { gap: 2 } }}
            >
                {options.map((option, index) => (
                    <FormControlLabel
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        control={
                            <Radio
                                sx={{ '&.MuiRadio-root': { p: 0, mr: 2 } }}
                            />
                        }
                        sx={{ '&.MuiFormControlLabel-root': { m: 0 } }}
                    />
                ))}
            </RadioGroup>
        </div>
    );
}
