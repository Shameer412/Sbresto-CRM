import React, { useState, useEffect } from "react";
import { useGetUserLeadsStatsQuery } from "../../features/api/apiSlice";
import {
  FiUsers,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiDollarSign,
  FiCheckCircle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// Modern color palette
const COLORS = {
  primary: '#4361ee',
  success: '#06d6a0',
  warning: '#ffbe0b',
  danger: '#ef476f',
  purple: '#7209b7',
  orange: '#f8961e',
  cyan: '#4cc9f0',
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgCard: 'rgba(30, 41, 59, 0.8)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  border: 'rgba(100, 116, 139, 0.3)',
  gradientPrimary: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
  gradientSuccess: 'linear-gradient(135deg, #06d6a0 0%, #048a81 100%)',
  gradientWarning: 'linear-gradient(135deg, #ffbe0b 0%, #fb5607 100%)',
  gradientDanger: 'linear-gradient(135deg, #ef476f 0%, #d90429 100%)',
  gradientPurple: 'linear-gradient(135deg, #7209b7 0%, #560bad 100%)'
};

const getColorVar = (varName, fallback) => {
  if (typeof window !== 'undefined') {
    const computed = getComputedStyle(document.documentElement).getPropertyValue(varName);
    return computed || fallback;
  }
  return fallback;
};

const LeadStatsCard = () => {
  const [lastUpdated, setLastUpdated] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // RTK Query
  const { data: statsData, isLoading, isError, error, refetch } = useGetUserLeadsStatsQuery();

  // Last updated on data fetch
  useEffect(() => {
    if (statsData) setLastUpdated(new Date().toLocaleTimeString());
  }, [statsData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const stats = statsData?.data;
  const loading = isLoading || isRefreshing;

  const statusColors = {
    'Document Upload Pending': getColorVar('--ld-warning', COLORS.warning),
    'In Process': getColorVar('--ld-primary', COLORS.primary),
    'Follow-up Needed': getColorVar('--ld-cyan', COLORS.cyan),
    'Closed': getColorVar('--ld-success', COLORS.success),
    'default': getColorVar('--ld-primary', COLORS.primary)
  };

  if (loading && !stats) return <LoadingSkeleton />;

  if (isError) return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: getColorVar('--ld-bg-card', COLORS.bgCard),
        padding: '24px',
        borderRadius: getColorVar('--ld-border-radius', '16px'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        color: getColorVar('--ld-danger', COLORS.danger),
        border: `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FiAlertCircle size={24} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Error Loading Data</h3>
      </div>
      <div style={{
        color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
        textAlign: 'center',
        fontSize: '14px'
      }}>
        {error?.data?.message || "Failed to fetch stats"}
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleRefresh}
        style={{
          background: getColorVar('--ld-danger', COLORS.danger),
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          marginTop: '8px',
          transition: 'all 0.2s ease',
          fontWeight: 500,
          fontSize: '14px'
        }}
      >
        <FiRefreshCw size={16} className={isRefreshing ? "spin" : ""} />
        Retry
      </motion.button>
    </motion.div>
  );

  if (!stats) return null;

  const conversionRate = stats.total_leads > 0
    ? Math.round(((stats.status_counts?.Closed || 0) / stats.total_leads) * 100)
    : 0;

  const statusDistribution = stats.status_counts ? Object.entries(stats.status_counts) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: getColorVar('--ld-text-primary', COLORS.textPrimary)
      }}
    >
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            color: getColorVar('--ld-text-primary', COLORS.textPrimary),
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: '1.3'
          }}>
            Lead Analytics Dashboard
          </h3>
          <p style={{
            margin: '4px 0 0',
            color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
            fontSize: '14px'
          }}>
            Comprehensive overview of your lead performance
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
            fontSize: '13px',
            background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getColorVar('--ld-success', COLORS.success)
            }} />
            <span>Last updated: {lastUpdated}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              background: 'none',
              border: `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
              color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <FiRefreshCw size={16} className={isRefreshing ? "spin" : ""} />
          </motion.button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '20px',
      }}>
        <StatCard
          icon={<FiUsers size={24} />}
          value={stats.total_leads ?? 0}
          label="Total Leads"
          color={getColorVar('--ld-primary', COLORS.primary)}
          loading={loading}
          trend={stats.leads_today > 0 ? 'up' : 'neutral'}
          trendValue={`+${stats.leads_today} today`}
          background={getColorVar('--ld-gradient-primary', COLORS.gradientPrimary)}
        />
        <StatCard
          icon={<FiTrendingUp size={24} />}
          value={`${conversionRate}%`}
          label="Conversion Rate"
          color={getColorVar('--ld-success', COLORS.success)}
          loading={loading}
          trend={conversionRate > 10 ? 'up' : 'down'}
          trendValue={conversionRate > 10 ? '+5% from last month' : '-2% from last month'}
          background={getColorVar('--ld-gradient-success', COLORS.gradientSuccess)}
        />
        <StatCard
          icon={<FiCalendar size={24} />}
          value={stats.leads_today ?? 0}
          label="Leads Today"
          color={getColorVar('--ld-warning', COLORS.warning)}
          loading={loading}
          trend={stats.leads_today > (stats.total_leads / 30) ? 'up' : 'down'}
          trendValue={stats.leads_today > (stats.total_leads / 30) ? 'Above daily avg' : 'Below daily avg'}
          background={getColorVar('--ld-gradient-warning', COLORS.gradientWarning)}
        />
        <StatCard
          icon={<FiDollarSign size={24} />}
          value={stats.revenue ? `$${stats.revenue.toLocaleString()}` : 'N/A'}
          label="Estimated Revenue"
          color={getColorVar('--ld-purple', COLORS.purple)}
          loading={loading}
          trend={stats.revenue_growth > 0 ? 'up' : 'down'}
          trendValue={stats.revenue_growth > 0 ? `+${stats.revenue_growth}% growth` : `${stats.revenue_growth}% decline`}
          background={getColorVar('--ld-gradient-purple', COLORS.gradientPurple)}
        />
      </div>

      {/* Status Distribution Section */}
      <div style={{
        background: getColorVar('--ld-bg-card', COLORS.bgCard),
        borderRadius: getColorVar('--ld-border-radius', '16px'),
        padding: '24px',
        border: `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h4 style={{
            margin: 0,
            color: getColorVar('--ld-text-primary', COLORS.textPrimary),
            fontSize: '16px',
            fontWeight: 600
          }}>
            Lead Status Distribution
          </h4>
          <div style={{
            color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
            fontSize: '14px'
          }}>
            {statusDistribution.length} status categories
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {statusDistribution.map(([status, count]) => (
            <StatusItem
              key={status}
              status={status}
              count={count}
              total={stats.total_leads}
              color={statusColors[status] || statusColors.default}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {/* Recent Activity */}
        <div style={{
          background: getColorVar('--ld-bg-card', COLORS.bgCard),
          borderRadius: getColorVar('--ld-border-radius', '16px'),
          padding: '24px',
          border: `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{
            margin: 0,
            marginBottom: '20px',
            color: getColorVar('--ld-text-primary', COLORS.textPrimary),
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FiFileText size={18} />
            Recent Activity
          </h4>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {stats.recent_activity?.length > 0 ? (
              stats.recent_activity.map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingBottom: '16px',
                  borderBottom: `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
                  '&:last-child': {
                    borderBottom: 'none',
                    paddingBottom: 0
                  }
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${statusColors[activity.status] || statusColors.default}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: statusColors[activity.status] || statusColors.default,
                    flexShrink: 0
                  }}>
                    <FiCheckCircle size={16} />
                  </div>
                  <div>
                    <div style={{
                      color: getColorVar('--ld-text-primary', COLORS.textPrimary),
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '4px'
                    }}>
                      {activity.lead_name}
                    </div>
                    <div style={{
                      color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{activity.status}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
                fontSize: '14px',
                textAlign: 'center',
                padding: '16px 0'
              }}>
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div style={{
          background: getColorVar('--ld-bg-card', COLORS.bgCard),
          borderRadius: getColorVar('--ld-border-radius', '16px'),
          padding: '24px',
          border: `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{
            margin: 0,
            marginBottom: '20px',
            color: getColorVar('--ld-text-primary', COLORS.textPrimary),
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FiBarChart2 size={18} />
            Performance Summary
          </h4>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <PerformanceMetric
              label="Weekly Leads"
              value={stats.weekly_leads || 0}
              change={stats.weekly_change || 0}
              loading={loading}
            />
            <PerformanceMetric
              label="Monthly Leads"
              value={stats.monthly_leads || 0}
              change={stats.monthly_change || 0}
              loading={loading}
            />
            <PerformanceMetric
              label="Response Time"
              value={stats.avg_response_time ? `${stats.avg_response_time}h` : 'N/A'}
              change={stats.response_time_change || 0}
              loading={loading}
              isTime={true}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatusItem = ({ status, count, total, color, loading }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={{
      background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
      borderRadius: '12px',
      padding: '16px',
      borderLeft: `4px solid ${color}`,
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          color: getColorVar('--ld-text-secondary', COLORS.textSecondary),
          fontWeight: 500
        }}>
          {status}
        </div>
        <div style={{
          fontSize: '12px',
          color: color,
          fontWeight: 600,
          background: `${color}20`,
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {percentage}%
        </div>
      </div>
      
      <div style={{
        fontSize: '24px',
        fontWeight: 700,
        color: getColorVar('--ld-text-primary', COLORS.textPrimary),
        marginBottom: '12px'
      }}>
        {loading ? (
          <div style={{
            width: '60px',
            height: '28px',
            background: getColorVar('--ld-bg-card', COLORS.bgCard),
            borderRadius: '6px'
          }} />
        ) : (
          count
        )}
      </div>
      
      <div style={{
        height: '6px',
        borderRadius: '3px',
        background: getColorVar('--ld-bg-card', COLORS.bgCard),
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
};

const PerformanceMetric = ({ label, value, change, loading, isTime = false }) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? getColorVar('--ld-success', COLORS.success) : getColorVar('--ld-danger', COLORS.danger);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '14px',
          color: getColorVar('--ld-text-secondary', COLORS.textSecondary)
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '12px',
          color: changeColor,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isPositive ? '↑' : '↓'}
          {Math.abs(change)}% {isPositive ? 'increase' : 'decrease'}
        </div>
      </div>
      
      <div style={{
        fontSize: '20px',
        fontWeight: 600,
        color: getColorVar('--ld-text-primary', COLORS.textPrimary)
      }}>
        {loading ? (
          <div style={{
            width: '80px',
            height: '24px',
            background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
            borderRadius: '6px'
          }} />
        ) : (
          value
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  value,
  label,
  color,
  loading,
  trend,
  trendValue,
  percentage,
  background
}) => {
  const cardVariants = {
    hover: {
      y: -5,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      style={{
        background: background || getColorVar('--ld-bg-card', COLORS.bgCard),
        borderRadius: getColorVar('--ld-border-radius', '16px'),
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: background ? 'none' : `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!background && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: color,
          borderRadius: '8px 8px 0 0'
        }} />
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: background ? 'rgba(255, 255, 255, 0.2)' : `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: background ? 'white' : color,
            flexShrink: 0
          }}>
            {icon}
          </div>

          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: background ? 'rgba(255, 255, 255, 0.15)' : getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              color: background ? 'white' : (
                trend === 'up' ? getColorVar('--ld-success', COLORS.success) :
                trend === 'down' ? getColorVar('--ld-danger', COLORS.danger) :
                getColorVar('--ld-text-secondary', COLORS.textSecondary)
              ),
              fontWeight: 500
            }}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trendValue}
            </div>
          )}
        </div>

        <div>
          <div style={{
            fontSize: '14px',
            color: background ? 'rgba(255, 255, 255, 0.8)' : getColorVar('--ld-text-secondary', COLORS.textSecondary),
            fontWeight: 500,
            marginBottom: '4px'
          }}>
            {label}
          </div>

          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: background ? 'white' : getColorVar('--ld-text-primary', COLORS.textPrimary),
            lineHeight: '1.2',
            marginBottom: '8px'
          }}>
            {loading ? (
              <div style={{
                width: '80px',
                height: '36px',
                background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
                borderRadius: '6px'
              }} />
            ) : (
              value
            )}
          </div>

          {percentage !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                height: '6px',
                borderRadius: '3px',
                background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
                flexGrow: 1,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '3px'
                }} />
              </div>
              <div style={{
                fontSize: '12px',
                color: background ? 'rgba(255, 255, 255, 0.7)' : getColorVar('--ld-text-secondary', COLORS.textSecondary)
              }}>
                {percentage}%
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LoadingSkeleton = () => {
  const skeletonCard = {
    background: getColorVar('--ld-bg-card', COLORS.bgCard),
    borderRadius: getColorVar('--ld-border-radius', '16px'),
    padding: '24px',
    border: `1px solid ${getColorVar('--ld-border', COLORS.border)}`,
    height: '180px',
    position: 'relative',
    overflow: 'hidden'
  };

  // Skeleton shimmer effect
  const SkeletonShimmer = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(90deg, 
        ${getColorVar('--ld-bg-card', COLORS.bgCard)} 0%, 
        ${getColorVar('--ld-bg-secondary', COLORS.bgSecondary)} 50%, 
        ${getColorVar('--ld-bg-card', COLORS.bgCard)} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite linear'
    }} />
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
    }}>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} style={skeletonCard}>
          <SkeletonShimmer />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
              }} />

              <div style={{
                width: '100px',
                height: '24px',
                background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
                borderRadius: '12px'
              }} />
            </div>

            <div>
              <div style={{
                width: '80px',
                height: '16px',
                background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
                borderRadius: '4px',
                marginBottom: '12px'
              }} />

              <div style={{
                width: '120px',
                height: '32px',
                background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
                borderRadius: '6px',
                marginBottom: '16px'
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
                  flexGrow: 1
                }} />
                <div style={{
                  width: '40px',
                  height: '12px',
                  background: getColorVar('--ld-bg-secondary', COLORS.bgSecondary),
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadStatsCard;