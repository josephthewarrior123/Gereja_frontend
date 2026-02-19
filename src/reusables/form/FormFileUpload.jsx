import { Icon } from '@iconify/react';

const FormFileUpload = ({ label, file, onClick, icon }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors h-32
            ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
    >
        <Icon
            icon={file ? "mdi:check-circle" : icon || "mdi:cloud-upload"}
            className={`mb-2 ${file ? 'text-blue-600' : 'text-gray-400'}`}
            width="28"
        />
        <span className={`text-xs font-medium ${file ? 'text-blue-700' : 'text-gray-600'}`}>
            {label}
        </span>
        {file && <span className="text-[10px] text-gray-500 mt-1 truncate max-w-full px-2">{file.name}</span>}
    </div>
);

export default FormFileUpload;
