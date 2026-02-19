import { Icon } from '@iconify/react';

const FormInput = ({ label, name, type = "text", placeholder, icon, required, value, onChange, multiline, rows, error }) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Icon icon={icon} width="18" height="18" />
            </div>
            {multiline ? (
                <textarea
                    name={name}
                    rows={rows || 3}
                    className={`block w-full pl-10 pr-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    className={`block w-full pl-10 pr-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
            )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

export default FormInput;
