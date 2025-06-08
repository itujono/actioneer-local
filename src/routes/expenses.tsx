import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { 
  BarChart4, 
  Filter, 
  ArrowDownAZ, 
  DollarSign, 
  Calendar, 
  ShoppingBag,
  Coffee,
  Plane,
  Home,
  ShoppingCart,
  Utensils
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses',
  component: Expenses,
});

// Category icons mapping
const categoryIcons = {
  food: <Utensils className="h-5 w-5" />,
  coffee: <Coffee className="h-5 w-5" />,
  travel: <Plane className="h-5 w-5" />,
  shopping: <ShoppingCart className="h-5 w-5" />,
  groceries: <ShoppingBag className="h-5 w-5" />,
  housing: <Home className="h-5 w-5" />,
  default: <DollarSign className="h-5 w-5" />
};

function Expenses() {
  const [timeframe, setTimeframe] = useState('month');
  const [sortBy, setSortBy] = useState('date');
  const [filterCategory, setFilterCategory] = useState('all');

  // Fetch receipts
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts', timeframe, sortBy, filterCategory],
    queryFn: async () => {
      // Create date range based on timeframe
      const now = new Date();
      let startDate = new Date();
      
      if (timeframe === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeframe === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (timeframe === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else if (timeframe === 'all') {
        startDate = new Date(0); // Beginning of time
      }
      
      // Build query
      let query = supabase
        .from('receipts')
        .select('*');
      
      if (timeframe !== 'all') {
        query = query.gte('date', startDate.toISOString());
      }
      
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }
      
      // Add sorting
      if (sortBy === 'date') {
        query = query.order('date', { ascending: false });
      } else if (sortBy === 'amount') {
        query = query.order('amount', { ascending: false });
      } else if (sortBy === 'merchant') {
        query = query.order('merchant', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  // Generate chart data
  const chartData = useMemo(() => {
    if (!receipts) return null;
    
    // Group by category
    const categories = {};
    receipts.forEach(receipt => {
      if (!categories[receipt.category]) {
        categories[receipt.category] = 0;
      }
      categories[receipt.category] += receipt.amount;
    });
    
    return {
      labels: Object.keys(categories),
      datasets: [
        {
          label: 'Spending by Category',
          data: Object.values(categories),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [receipts]);

  // Calculate total spending
  const totalSpending = useMemo(() => {
    if (!receipts) return 0;
    return receipts.reduce((total, receipt) => total + receipt.amount, 0);
  }, [receipts]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!receipts) return [];
    const categorySet = new Set(receipts.map(receipt => receipt.category));
    return Array.from(categorySet);
  }, [receipts]);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Receipts & Expenses</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and analyze your spending from email receipts
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Spending
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      ${totalSpending.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-teal-500 rounded-md p-3">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Receipts
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {receipts?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Showing For
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {timeframe === 'month' ? 'Last 30 Days' : 
                       timeframe === 'quarter' ? 'Last 3 Months' : 
                       timeframe === 'year' ? 'Last 12 Months' : 'All Time'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <BarChart4 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average per Receipt
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      ${receipts?.length ? (totalSpending / receipts.length).toFixed(2) : '0.00'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters and Chart */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
                  Time Period
                </label>
                <select
                  id="timeframe"
                  name="timeframe"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">Last 12 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <select
                  id="sortBy"
                  name="sortBy"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="amount">Amount (Highest First)</option>
                  <option value="merchant">Merchant (A-Z)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : chartData ? (
              <div className="h-64">
                <Bar 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '$' + value;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
        
        {/* Receipts Table */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Receipts</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {receipts?.length || 0} receipts
            </span>
          </div>
          <ul className="divide-y divide-gray-200">
            {isLoading ? (
              <li className="px-4 py-4 sm:px-6 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </li>
            ) : receipts?.length ? (
              receipts.map((receipt) => (
                <li key={receipt.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          {categoryIcons[receipt.category.toLowerCase()] || categoryIcons.default}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 px-4">
                        <div>
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {receipt.merchant}
                          </p>
                          <p className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="truncate">{receipt.category}</span>
                            <span className="mx-1">•</span>
                            <span>{new Date(receipt.date).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <p className="inline-flex text-lg font-semibold text-gray-900">
                        {receipt.currency} {receipt.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-12 text-center text-gray-500">
                No receipts found
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}