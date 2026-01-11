import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/login.jsx";
import Register from "./pages/auth/register.jsx";
import PostRegistrationForm from "./pages/post-registrationform.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import Dashboard from "./pages/member/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";


function App() {
  return (
    <AuthProvider>
      <Routes>

        <Route element={
          <PublicRoute />}>
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
        </Route>

        <Route element={
          <ProtectedRoute allowedRoles={["member"]} />}>
            <Route path="/postform" element={<PostRegistrationForm />} />
            <Route path="/member/dashboard" element={<Dashboard />} />
          </Route> 
            

          <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
    
  )
}

export default App
