
'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import {
  DollarSign,
  Users,
  Briefcase,
  MessageSquareWarning,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Booking, Complaint, UserProfile } from '@/lib/types';
import { format, subMonths } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, usersRes, complaintsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/users'),
          fetch('/api/complaints'),
        ]);

        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (complaintsRes.ok) setComplaints(await complaintsRes.json());

      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
  const totalBookings = bookings.length;
  const providerCount = users.filter(u => u.role === 'provider').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;

  const getMonthlyRevenue = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    const monthlyData = last6Months.map(month => {
      const monthName = format(month, 'MMM');
      const revenue = bookings
        .filter(b => format(new Date(b.date), 'yyyy-MM') === format(month, 'yyyy-MM'))
        .reduce((sum, b) => sum + b.price, 0);
      return { name: monthName, revenue: revenue };
    }).reverse();
    return monthlyData;
  };
  
  const getServiceDistribution = () => {
    const serviceCounts = { standard: 0, deep: 0, 'move-out': 0 };
    bookings.forEach(booking => {
      serviceCounts.standard += booking.roomCounts.standard;
      serviceCounts.deep += booking.roomCounts.deep;
      serviceCounts['move-out'] += booking.roomCounts['move-out'];
    });

    return [
      { name: 'Standard Clean', value: serviceCounts.standard },
      { name: 'Deep Clean', value: serviceCounts.deep },
      { name: 'Move-In/Out Clean', value: serviceCounts['move-out'] },
    ].filter(item => item.value > 0);
  };

  const monthlyRevenueData = getMonthlyRevenue();
  const serviceDistributionData = getServiceDistribution();
  const recentBookings = bookings.slice(0, 5);

  const StatCard = ({ title, value, icon: Icon, description, loading }: { title: string, value: string | number, icon: React.ElementType, description: string, loading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{value}</div>}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          An overview of your business performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} description="Total revenue from all bookings" loading={loading} />
        <StatCard title="Total Bookings" value={totalBookings} icon={Briefcase} description="Total number of jobs scheduled" loading={loading} />
        <StatCard title="Active Providers" value={providerCount} icon={Users} description="Total number of service providers" loading={loading} />
        <StatCard title="Resolved Complaints" value={resolvedComplaints} icon={MessageSquareWarning} description="Total complaints marked as resolved" loading={loading} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><TrendingUp />Monthly Revenue</CardTitle>
            <CardDescription>Revenue from the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{ fill: 'hsla(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><Activity />Service Distribution</CardTitle>
            <CardDescription>Breakdown of services by rooms cleaned.</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Your 5 most recent bookings.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map(booking => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <div className="font-medium">{booking.userName}</div>
                        <div className="text-sm text-muted-foreground">{booking.building}</div>
                      </TableCell>
                      <TableCell>{booking.service}</TableCell>
                      <TableCell><Badge variant="outline">{booking.status}</Badge></TableCell>
                      <TableCell className="text-right">${booking.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </>
  );
}
