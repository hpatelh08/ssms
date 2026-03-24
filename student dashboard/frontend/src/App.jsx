import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkSession, loginUser, clearError } from './store/authSlice';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import SubjectPage from './pages/SubjectPage';
import PDFViewer from './pages/PDFViewer';
import './App.css';

const DEMO_STUDENT = {
    email: 'stu08A001',
    password: 'stu001'
};

function PrivateRoute({ children }) {
    const { isAuthenticated, isAuthChecked, user } = useSelector((state) => state.auth);

    if (!isAuthChecked) {
        return <div className="loading-screen">Initializing...</div>;
    }

    if (!isAuthenticated || !user || !user.uid) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function AutoLoginEntry() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const startedRef = useRef(false);
    const { isAuthenticated, isAuthChecked, user, loading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthChecked) {
            return;
        }

        if (isAuthenticated && user?.uid) {
            navigate(`/dashboard/${user.uid}`, { replace: true });
            return;
        }

        if (startedRef.current) {
            return;
        }

        startedRef.current = true;
        dispatch(clearError());

        dispatch(loginUser(DEMO_STUDENT)).then((result) => {
            if (result.type === 'auth/login/fulfilled' && result.payload?.uid) {
                navigate(`/dashboard/${result.payload.uid}`, { replace: true });
            } else {
                startedRef.current = false;
            }
        });
    }, [dispatch, isAuthChecked, isAuthenticated, navigate, user]);

    return (
        <div className="loading-screen">
            <div className="spinner"></div>
            <p>{loading ? 'Opening Class 8 portal...' : 'Redirecting to dashboard...'}</p>
            {error && <p style={{ marginTop: '0.75rem' }}>Auto-login failed. Retrying is available on refresh.</p>}
        </div>
    );
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<AutoLoginEntry />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Signup />} />
            <Route
                path="/dashboard/:uid"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <ProfilePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/books/:subject"
                element={
                    <PrivateRoute>
                        <SubjectPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/books/:subject/chapter/:chapterId"
                element={
                    <PrivateRoute>
                        <PDFViewer />
                    </PrivateRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(checkSession());
    }, [dispatch]);

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
        </Router>
    );
}

export default App;
