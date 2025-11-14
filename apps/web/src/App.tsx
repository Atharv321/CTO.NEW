import { Routes, Route } from 'react-router-dom';
import { Layout } from '@components/Layout/Layout';
import { HomePage } from '@pages/HomePage';
import { NotFoundPage } from '@pages/NotFoundPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
function App() {
  return (
    <div>
      <h1>Welcome to Monorepo Web App</h1>
      <p>This is the frontend application.</p>
    </div>
  );
}

export default App;
