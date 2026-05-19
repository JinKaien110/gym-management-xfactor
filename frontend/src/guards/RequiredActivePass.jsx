

export default function RequiredActivePass({ children }) {
    const { user, loading } = useAuth();

    if(loading) return <LoadingSpinner />

    if(!user) return <Navigate to="/login" />;

    const hasActivePass = user.client_pass && user.client_pass.status === "active";
    if(!hasActivePass) {
        return <Navigate to="/client/expired" replace />
    }


}