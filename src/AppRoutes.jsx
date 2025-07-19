import { Route, Routes } from 'react-router';
import QrScanPage from './pages/qr-scan/QrScanPage';
import Page404 from './pages/miscellaneous/Page404';
import DashboardLayout from './reusables/layouts/DashboardLayout';
import GuestListPage from './pages/guests/GuestListPage';
import CoupleList from './pages/studios/CoupleListPage';
import CoupleManage from './pages/studios/CoupleManagePage';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<DashboardLayout />}>
                {/* Couple Section */}
                <Route index element={<CoupleList />} />
                <Route path="couples">
                    <Route index element={<CoupleList />} />
                    <Route path=":id" element={<CoupleManage />} />
                </Route>

                {/* Other Pages */}
                <Route path="qr-scan" element={<QrScanPage />} />
                <Route path="guests" element={<GuestListPage />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<Page404 />} />
        </Routes>
    );
}
