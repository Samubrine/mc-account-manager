import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AppLock from './components/AppLock';

function App() {
    return (
        <HashRouter>
            <AppLock>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/banned" element={<Accounts />} />
                    </Routes>
                </Layout>
            </AppLock>
        </HashRouter>
    );
}

export default App;
