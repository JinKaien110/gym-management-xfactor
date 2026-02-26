import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import AdminLogin from "./pages/admin/Login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminMembers from "./pages/admin/Members.jsx";
import AdminMembershipRequests from "./pages/admin/MembershipRequests.jsx";
import PostRegistrationForm from "./pages/Post-Registrationform.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import Dashboard from "./pages/member/Dashboard.jsx";
import DiscountRequestForm from "./pages/member/DiscountRequestForm.jsx";
import PaymentForm from "./pages/member/PaymentForm.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentFailed from "./pages/PaymentFailed.jsx";
import NotFound from "./pages/NotFound.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />

        <Route element={
          <PublicRoute />}>
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/admin/login' element={<AdminLogin />} />
            <Route path='/payment/success' element={<PaymentSuccess />} />
            <Route path='/payment/failed' element={<PaymentFailed />} />
        </Route>

        {/* Admin Routes with Sidebar Layout */}
        <Route element={
          <ProtectedRoute allowedUserTypes={["admin", "superadmin"]} allowedRoles={["admin", "superadmin", "staff"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            {/* Placeholder routes for other admin modules */}
            <Route path="members" element={<AdminMembers />} />
            <Route path="membership-requests" element={<AdminMembershipRequests />} />
            <Route path="memberships" element={<div className="text-white p-8">Memberships Management - Coming Soon</div>} />
            <Route path="payments" element={<div className="text-white p-8">Payments Management - Coming Soon</div>} />
            <Route path="classes" element={<div className="text-white p-8">Classes Management - Coming Soon</div>} />
            <Route path="schedules" element={<div className="text-white p-8">Schedules Management - Coming Soon</div>} />
            <Route path="trainers" element={<div className="text-white p-8">Trainers Management - Coming Soon</div>} />
            <Route path="pricing" element={<div className="text-white p-8">Pricing Management - Coming Soon</div>} />
            <Route path="plans" element={<div className="text-white p-8">Plans Management - Coming Soon</div>} />
            <Route path="bookings" element={<div className="text-white p-8">Bookings Management - Coming Soon</div>} />
            <Route path="discounts" element={<div className="text-white p-8">Discounts Management - Coming Soon</div>} />
            <Route path="ai-recommendations" element={<div className="text-white p-8">AI Recommendations - Coming Soon</div>} />
          </Route>
        </Route>

        <Route element={
          <ProtectedRoute allowedUserTypes={["member"]} allowedRoles={["member"]} />}>
            <Route path="/member/postform" element={<PostRegistrationForm />} />
            <Route path="/member/dashboard" element={<Dashboard />} />
            <Route path="/member/discount-request" element={<DiscountRequestForm />} />
            <Route path="/member/payment" element={<PaymentForm />} />
          </Route> 
          

          <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
    
  )
}

export default App
