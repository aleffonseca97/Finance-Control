import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListOrdered,
  Link2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ListOrdered, label: 'Transações' },
  { to: '/integrations', icon: Link2, label: 'Integrações' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <button type="button" className="sidebar-toggle" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <Menu size={24} />
      </button>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu">
          <X size={24} />
        </button>
        <div className="sidebar-brand">Controle Financeiro</div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} role="presentation" />}
    </>
  );
}
