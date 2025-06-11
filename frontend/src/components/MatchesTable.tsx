import React, { useState, useMemo, useEffect } from 'react';
import { 
  FiDownload, 
  FiFilter, 
  FiChevronDown, 
  FiChevronUp, 
  FiSearch, 
  FiExternalLink,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiInfo,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from 'react-icons/fi';
import styles from './MatchesTable.module.css';

type MatchStatus = 'matched' | 'partial' | 'unmatched';

interface Match {
  id: string;
  invoiceId: string;
  payoutId: string | null;
  invoiceAmount: number;
  payoutAmount: number | null;
  fee: number | null;
  status: MatchStatus;
  confidence: number | null;
  date: string;
  invoiceDate?: string;
  payoutDate?: string | null;
  customerName?: string;
  description?: string;
  currency?: string;
  metadata?: {
    source?: string;
    lastUpdated?: string;
    matchType?: string;
  };
}

interface MatchesTableProps {
  matches: Match[];
  onDownload?: () => void;
  currency?: string;
  onRowClick?: (match: Match) => void;
  showActions?: boolean;
  className?: string;
}

const formatCurrency = (amount: number | null | undefined, currency: string = 'USD'): string => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusIcon = (status: MatchStatus) => {
  switch (status) {
    case 'matched':
      return <FiCheckCircle className={styles.statusIcon} />;
    case 'partial':
      return <FiAlertTriangle className={styles.statusIcon} />;
    case 'unmatched':
      return <FiXCircle className={styles.statusIcon} />;
    default:
      return <FiInfo className={styles.statusIcon} />;
  }
};

const StatusBadge: React.FC<{ 
  status: MatchStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, showIcon = true, size = 'md' }) => {
  const statusConfig = {
    matched: { 
      label: 'Matched',
      className: styles.statusMatched,
      icon: <FiCheckCircle />
    },
    partial: {
      label: 'Partial',
      className: styles.statusPartial,
      icon: <FiAlertTriangle />
    },
    unmatched: {
      label: 'Unmatched',
      className: styles.statusUnmatched,
      icon: <FiXCircle />
    }
  };

  const { label, className, icon } = statusConfig[status] || statusConfig.unmatched;
  
  return (
    <div className={`${styles.statusBadge} ${className} ${styles[size]}`}>
      {showIcon && <span className={styles.statusIcon}>{icon}</span>}
      <span className={styles.statusLabel}>{label}</span>
    </div>
  );
};

export const MatchesTable: React.FC<MatchesTableProps> = ({ 
  matches, 
  onDownload, 
  currency = 'USD',
  onRowClick,
  showActions = true,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Match; direction: 'asc' | 'desc' } | null>({
    key: 'date',
    direction: 'desc'
  });

  const filteredAndSortedMatches = useMemo(() => {
    let filtered = [...matches];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(match => 
        match.invoiceId.toLowerCase().includes(term) ||
        (match.payoutId?.toLowerCase().includes(term) ?? false) ||
        (match.customerName?.toLowerCase().includes(term) ?? false) ||
        (match.description?.toLowerCase().includes(term) ?? false)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

        // Compare values
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [matches, searchTerm, statusFilter, sortConfig]);

  const requestSort = (key: keyof Match) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Match) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  const handleRowClick = (match: Match) => {
    if (onRowClick) {
      onRowClick(match);
    }
  };

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <FiSearch size={40} />
      </div>
      <h3>No matches found</h3>
      <p>Try adjusting your search or filter criteria</p>
      {onDownload && (
        <button 
          className={styles.primaryButton}
          onClick={onDownload}
        >
          <FiDownload /> Export All Matches
        </button>
      )}
    </div>
  );

  if (!matches.length) {
    return renderEmptyState();
  }

  // Calculate pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMatches.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedMatches.slice(indexOfFirstItem, indexOfLastItem);
  
  // Reset to first page if current page is out of bounds after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages, filteredAndSortedMatches.length]);

  const handlePageChange = (page: number) => {
    // Ensure page is within valid range
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    // Smooth scroll to top of table
    const tableContainer = document.querySelector(`.${styles.tableContainer}`);
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate start and end pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start or end
      if (currentPage <= 3) {
        endPage = 4;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          pageNumbers.push(i);
        }
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.tableHeader}>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search invoices, payouts, customers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <div className={styles.filterSelect}>
            <FiFilter className={styles.filterIcon} />
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as MatchStatus | 'all');
                setCurrentPage(1);
              }}
              className={styles.statusSelect}
            >
              <option value="all">All Statuses</option>
              <option value="matched">Matched</option>
              <option value="partial">Partially Matched</option>
              <option value="unmatched">Unmatched</option>
            </select>
          </div>
          
          {onDownload && (
            <div className={styles.dropdown}>
              <button className={styles.downloadButton}>
                <FiDownload /> Export
              </button>
              <div className={styles.dropdownContent}>
                <button onClick={() => onDownload()}>
                  <FiDownload size={14} /> Current View ({filteredAndSortedMatches.length})
                </button>
                <button onClick={() => onDownload()}>
                  <FiDownload size={14} /> All Matches ({matches.length})
                </button>
              </div>
            </div>
          )}
          
          {showActions && onRowClick && (
            <button 
              className={`${styles.secondaryButton} ${styles.viewAllButton}`}
              onClick={() => onRowClick && onRowClick(filteredAndSortedMatches[0])}
            >
              View All Matches
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.statusColumn}>Status</th>
              <th 
                className={`${styles.sortableHeader} ${sortConfig?.key === 'date' ? styles.sorted : ''}`}
                onClick={() => requestSort('date')}
              >
                Date {getSortIcon('date')}
              </th>
              <th 
                className={`${styles.sortableHeader} ${sortConfig?.key === 'invoiceId' ? styles.sorted : ''}`}
                onClick={() => requestSort('invoiceId')}
              >
                Invoice ID {getSortIcon('invoiceId')}
              </th>
              <th>Payout ID</th>
              <th>Customer</th>
              <th 
                className={`${styles.sortableHeader} ${sortConfig?.key === 'invoiceAmount' ? styles.sorted : ''}`}
                onClick={() => requestSort('invoiceAmount')}
              >
                Amount {getSortIcon('invoiceAmount')}
              </th>
              <th>Confidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((match) => {
                const matchCurrency = match.currency || currency;
                const confidence = match.confidence ?? 0;
                const confidenceColor = 
                  confidence >= 90 ? 'high' : 
                  confidence >= 70 ? 'medium' : 'low';
                
                return (
                  <tr 
                    key={match.id || `${match.invoiceId}-${match.payoutId}`}
                    className={`${styles.tableRow} ${onRowClick ? styles.clickableRow : ''}`}
                    onClick={() => onRowClick && onRowClick(match)}
                  >
                    <td className={styles.statusCell}>
                      <StatusBadge status={match.status} size="sm" />
                    </td>
                    <td className={styles.dateCell}>
                      <div className={styles.dateValue}>
                        {formatDate(match.invoiceDate || match.date)}
                      </div>
                      {match.payoutDate && (
                        <div className={styles.secondaryDate}>
                          <FiClock size={12} /> {formatDate(match.payoutDate)}
                        </div>
                      )}
                    </td>
                    <td className={styles.invoiceId}>
                      <div className={styles.idValue}>{match.invoiceId}</div>
                      {match.metadata?.source && (
                        <div className={styles.metaInfo}>
                          {match.metadata.source}
                        </div>
                      )}
                    </td>
                    <td>
                      {match.payoutId ? (
                        <>
                          <div className={styles.idValue}>{match.payoutId}</div>
                          {match.metadata?.matchType && (
                            <div className={styles.matchType}>
                              {match.metadata.matchType}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td>
                      {match.customerName || <span className={styles.muted}>—</span>}
                    </td>
                    <td className={styles.amountCell}>
                      <div className={styles.amountValue}>
                        {formatCurrency(match.invoiceAmount, matchCurrency)}
                      </div>
                      {match.payoutAmount !== null && match.payoutAmount !== undefined && (
                        <div className={`${styles.secondaryAmount} ${
                          Math.abs(match.invoiceAmount - match.payoutAmount) > 0.01 ? styles.amountMismatch : ''
                        }`}>
                          <FiDollarSign size={10} /> 
                          {formatCurrency(match.payoutAmount, matchCurrency)}
                          {match.fee !== null && match.fee !== undefined && (
                            <span className={styles.feeBadge}>
                              Fee: {formatCurrency(match.fee, matchCurrency)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {match.confidence !== null && match.confidence !== undefined ? (
                        <div className={styles.confidenceMeter}>
                          <div 
                            className={`${styles.confidenceBar} ${styles[confidenceColor]}`}
                            style={{ width: `${Math.min(100, Math.max(0, match.confidence))}%` }}
                          ></div>
                          <span className={styles.confidenceValue}>
                            {Math.round(match.confidence)}%
                          </span>
                        </div>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      {onRowClick && (
                        <button 
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(match);
                          }}
                          title="View details"
                        >
                          <FiExternalLink size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className={styles.noResults}>
                  {renderEmptyState()}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {filteredAndSortedMatches.length > 0 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAndSortedMatches.length)} of {filteredAndSortedMatches.length} matches
            </div>
            
            <div className={styles.paginationControls}>
              <select 
                className={styles.itemsPerPage}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Items per page"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              <button 
                className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                <FiChevronsLeft size={16} />
              </button>
              
              <button 
                className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <FiChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map((pageNum, index) => (
                typeof pageNum === 'number' ? (
                  <button
                    key={pageNum}
                    className={`${styles.paginationButton} ${currentPage === pageNum ? styles.active : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                ) : (
                  <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>
                    {pageNum}
                  </span>
                )
              ))}
              
              <button 
                className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <FiChevronRight size={16} />
              </button>
              
              <button 
                className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                <FiChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.tableFooter}>
        <div className={styles.resultsCount}>
          Showing {filteredAndSortedMatches.length} of {matches.length} results
        </div>
        <div className={styles.pagination}>
          <button className={styles.paginationButton} disabled>
            Previous
          </button>
          <button className={`${styles.paginationButton} ${styles.active}`}>
            1
          </button>
          <button className={styles.paginationButton}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchesTable;
