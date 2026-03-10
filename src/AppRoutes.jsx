import { Route, Routes } from 'react-router';
import Page404 from './pages/miscellaneous/Page404';
import DashboardLayout from './reusables/layouts/DashboardLayout';
import LoginPage from './pages/authentications/LoginPage';
import SignUpPage from './pages/authentications/SignupPage';
import AdminList from './pages/Admin/AdminList';
import AdminEdit from './pages/Admin/AdminEdit';
import AdminAssignPage from './pages/Admin/AdminAssignPage';
import DashboardPage from './pages/dashboard/Dashboard';
import UserListPage from './pages/User/UserList';
import CreateUserPage from './pages/User/CreateUserPage';
import EdituserPage from './pages/User/EdituserPage';
import JournalPage from './pages/journal/Journalpage';
import SubmitEntryPage from './pages/journal/Submitentrypage';
import ActivityFormPage from './pages/journal/Activityformpage';
import GroupListPage from './pages/Group/GroupListPage';
import GroupFormDialog from './pages/Group/GroupFormDialog';
import GroupDeleteDialog from './pages/Group/GroupDeleteDialog';
import LeaderboardList from './pages/Leaderboard/LeaderboardList';
import OnboardingPage from './pages/authentications/OnboardingPage';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route path="/" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />

                {/* User Routes */}
                <Route path="/users" element={<UserListPage />} />
                <Route path="/users/create" element={<CreateUserPage />} />
                <Route path="/users/:username/edit" element={<EdituserPage />} />

                <Route path="/leaderboard" element={<LeaderboardList />} />
                {/* Dashboard Routes */}
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Journal Routes */}
                <Route path="journal" element={<JournalPage />} />
                <Route path="journal/submit" element={<SubmitEntryPage />} />
                <Route path="journal/activities/create" element={<ActivityFormPage />} />
                <Route path="journal/activities/:activityId/edit" element={<ActivityFormPage />} />

                <Route path="group" element={<GroupListPage />} />
                <Route path="group/create" element={<GroupFormDialog />} />
                <Route path="group/:groupId/edit" element={<GroupFormDialog />} />
                <Route path="group/:groupId/delete" element={<GroupDeleteDialog />} />

                {/* Other Routes */}
                <Route path="admin-management" element={<AdminList />} />
                <Route path="edit-admin/:id" element={<AdminEdit />} />
                <Route path="assign-admin/:id" element={<AdminAssignPage />} />
            </Route>

            <Route path="*" element={<Page404 />} />
        </Routes>
    );
}