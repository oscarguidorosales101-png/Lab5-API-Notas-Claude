import React from 'react';

export const StatsCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  badgeText,
  badgeVariant = 'info',
  color = 'var(--primary-600)',
  bgColor = 'var(--primary-50)'
}) => {
  return (
    <div className="card stats-card">
      <div className="stats-header">
        <span className="stats-title">{title}</span>
        {Icon && (
          <div className="stats-icon-wrapper" style={{ color, backgroundColor: bgColor }}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stats-value-wrapper">
        <span className="stats-value">{value}</span>
        {badgeText && (
          <span className={`badge badge-${badgeVariant}`}>{badgeText}</span>
        )}
      </div>
      {subtitle && <p className="stats-subtitle">{subtitle}</p>}
      <style>{`
        .stats-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1.25rem;
        }
        .stats-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .stats-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stats-icon-wrapper {
          padding: 0.5rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stats-value-wrapper {
          display: flex;
          align-items: baseline;
          gap: 0.625rem;
          margin-top: 0.25rem;
        }
        .stats-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.03em;
        }
        .stats-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default StatsCard;

