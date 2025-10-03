import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple mock authentication
    if (email === 'admin@care.com' && password === 'admin123') {
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Lock size={48} />
          <h1>Admin Login</h1>
          <p>Access the content management system</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="admin@care.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg">
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-info">
            Demo credentials:<br />
            Email: admin@care.com<br />
            Password: admin123
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .login-card {
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 400px;
          overflow: hidden;
        }

        .login-header {
          background: var(--brand-gradient);
          color: white;
          padding: var(--spacing-xl);
          text-align: center;
        }

        .login-header h1 {
          color: white;
          margin: var(--spacing-md) 0 var(--spacing-sm) 0;
        }

        .login-header p {
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        .login-form {
          padding: var(--spacing-xl);
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .error-alert {
          background: rgba(245, 101, 101, 0.1);
          border: 1px solid var(--accent-red);
          color: var(--accent-red);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }

        .btn-lg {
          width: 100%;
        }

        .login-footer {
          background: var(--bg-secondary);
          padding: var(--spacing-lg);
          text-align: center;
        }

        .demo-info {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
}