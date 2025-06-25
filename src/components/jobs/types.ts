export type JobApplication = {
  id: string;
  email_id: string;
  company: string;
  position: string;
  status: string;
  applied_date: string;
  country_code?: string;
  country?: string;
  website?: string;
  details: any;
  created_at: string;
};

// New types for grouping feature
export type JobApplicationGroup = {
  groupKey: string; // normalized company + position
  company: string;
  position: string;
  applications: JobApplication[];
  latestStatus: string;
  latestDate: string;
  statusHistory: Array<{
    status: string;
    date: string;
    application: JobApplication;
  }>;
  isGrouped: boolean;
};

export type GroupedJobApplications = {
  data: JobApplicationGroup[];
  totalCount: number;
};

export type SortConfig = {
  key: keyof JobApplication;
  direction: "asc" | "desc";
};

export interface JobsControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  uniqueStatuses: string[];
  pageSize: number;
  setPageSize: (size: number) => void;
  groupSimilarApplications: boolean;
  setGroupSimilarApplications: (grouped: boolean) => void;
}

export interface JobsStatsProps {
  jobApplications: JobApplication[] | undefined;
  isLoading: boolean;
}

export interface JobsTableProps {
  isLoading: boolean;
  filteredAndSortedApplications: {
    data: JobApplication[];
    totalCount: number;
  };
  sortConfig: SortConfig;
  handleSort: (key: string) => void;
  columnOrder: any[];
  onDragEnd: (event: any) => void;
  customFields: any[];
  getCustomFieldValue: (details: any, fieldName: string) => any;
  updateJobApplicationMutation: any;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  startItem: number;
  endItem: number;
  onEditCustomField?: (fieldId: string) => void;
  onDeleteApplication?: (applicationId: string) => void;
}

export interface JobTableRowProps {
  application: JobApplication;
  columnOrder: any[];
  customFields: any[];
  getCustomFieldValue: (details: any, fieldName: string) => any;
  updateJobApplicationMutation: any;
  onDeleteApplication?: (applicationId: string) => void;
}
