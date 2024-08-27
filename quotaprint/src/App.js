import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QuotaPrint from './components/quotaPrint';
import ViewDetailQuota from './components/viewDetailQuota';
import BorrowLaptop from './components/borrowLaptop';
import ViewDetailBorrow from './components/viewDetailBorrow';
import ViewDetail from './components/viewDetail';
import MainPage from './components/mainPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/quota-print" element={<QuotaPrint />} />
                <Route path="/borrow-laptop" element={<BorrowLaptop />} />
                <Route path="/view-detail" element={<ViewDetail />} />
                <Route path="/view-detail-quota" element={<ViewDetailQuota />} />
                <Route path="/view-detail-borrow" element={<ViewDetailBorrow />} />
            </Routes>
        </Router>
    );
}

export default App;
