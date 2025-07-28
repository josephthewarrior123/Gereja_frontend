import { Route, Routes } from 'react-router';
import QrScanPage from './pages/qr-scan/QrScanPage';
import Page404 from './pages/miscellaneous/Page404';
import DashboardLayout from './reusables/layouts/DashboardLayout';
import GuestListPage from './pages/guests/GuestListPage';
import CoupleList from './pages/studios/CoupleListPage';
import CoupleManage from './pages/studios/CoupleManagePage';
import LoginPage from './pages/authentications/LoginPage';
import AdminList from './pages/Admin/AdminList';
import CreateAdmin from './pages/Admin/CreateAdmin';
import AdminEdit from './pages/Admin/AdminEdit';
import AdminAssignPage from './pages/Admin/AdminAssignPage';


export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<DashboardLayout />}>
                <Route index element={<CoupleList />} />
                <Route path="couples">
                    <Route index element={<CoupleList />} />
                    <Route path=":id" element={<CoupleManage />} />
                </Route>
                <Route path="qr-scan" element={<QrScanPage />} />
                <Route path="admin-management" element={<AdminList/>} />
                <Route path="create-admin" element={<CreateAdmin />} />
                <Route path="edit-admin/:id" element={<AdminEdit />} />
                <Route path="assign-admin/:id" element={<AdminAssignPage />} /> 

                <Route path="guests" element={<GuestListPage />} />
            </Route>

            <Route path="*" element={<Page404 />} />
        </Routes>
    );
}