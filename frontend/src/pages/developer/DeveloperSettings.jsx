import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import APIKeys from './APIKeys';
import Webhooks from './Webhooks';
import WebhookDeliveries from './WebhookDeliveries';
import IntegrationLogs from './IntegrationLogs';
import EventCatalog from './EventCatalog';

const tabs = [
  { key: 'api-keys', label: 'API Keys', icon: '🔑', path: '' },
  { key: 'webhooks', label: 'Webhooks', icon: '🔗', path: 'webhooks' },
  { key: 'deliveries', label: 'Webhook Deliveries', icon: '📬', path: 'deliveries' },
  { key: 'logs', label: 'Integration Logs', icon: '📋', path: 'logs' },
  { key: 'events', label: 'Event Catalog', icon: '📡', path: 'events' },
];

export default function DeveloperSettings() {
  const { workspace } = useAuthStore();
  const wid = workspace?._id || workspace?.id;
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }} className="p-0">
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} className="px-8 pt-8 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            ⚡
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Developer Settings</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>API keys, webhooks, integrations & developer tools</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.path}
              end={tab.path === ''}
              style={({ isActive }) => ({
                padding: '10px 20px',
                borderRadius: '10px 10px 0 0',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                borderBottom: isActive ? '2px solid #667eea' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              })}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="p-8">
        <Routes>
          <Route index element={<APIKeys wid={wid} />} />
          <Route path="api-keys" element={<APIKeys wid={wid} />} />
          <Route path="webhooks" element={<Webhooks wid={wid} />} />
          <Route path="deliveries" element={<WebhookDeliveries wid={wid} />} />
          <Route path="logs" element={<IntegrationLogs wid={wid} />} />
          <Route path="events" element={<EventCatalog wid={wid} />} />
        </Routes>
      </div>
    </div>
  );
}
