'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { Booking, BookingStatus, UserProfile } from '@/lib/types';
import { BookingDetails } from '@/components/booking-details';

const statusFilters: (BookingStatus | 'All')[] = [
  'All',
  'New Request',
  'In Process',
  'Completed',
];

type ProviderProfile = UserProfile & { role: 'provider' };

export default function OngoingServicesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBuilding, setSelectedBuilding] =
    useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<BookingStatus | 'All'>('All');

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [bookingsRes, usersRes, buildingsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/users'),
          fetch('/api/buildings'), // ✅ NEW
        ]);

        if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        if (!buildingsRes.ok) throw new Error('Failed to fetch buildings');

        const bookingsData: Booking[] = await bookingsRes.json();
        const usersData: UserProfile[] = await usersRes.json();
        const buildingsData: { name: string }[] =
          await buildingsRes.json();

        setBookings(bookingsData);
        setProviders(
          usersData.filter(
            (u): u is ProviderProfile => u.role === 'provider'
          )
        );
        setBuildings(buildingsData.map(b => b.name));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ---------------- FILTERED BOOKINGS ---------------- */
  const filteredBookings = useMemo(() => {
    if (!selectedBuilding) return [];

    return bookings
      .filter(b => {
        const buildingMatch = b.building === selectedBuilding;
        const statusMatch =
          statusFilter === 'All' || b.status === statusFilter;

        return buildingMatch && statusMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [bookings, selectedBuilding, statusFilter]);

  /* ---------------- HELPERS ---------------- */
  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const getProviderForBooking = (booking: Booking) =>
    providers.find(p => p.name === booking.provider);

  /* ================= UI ================= */
  return (
    <>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">
          Ongoing Services
        </h1>
        <p className="text-muted-foreground mt-2">
          Track the status of all cleaning jobs from booking to completion.
        </p>
      </div>

      {/* BUILDING FILTER */}
      <div className="flex flex-wrap gap-2 mb-6">
        {buildings.map(building => (
          <Button
            key={building}
            variant={
              selectedBuilding === building
                ? 'default'
                : 'outline'
            }
            onClick={() => {
              setSelectedBuilding(building);
              setStatusFilter('All');
            }}
          >
            {building}
          </Button>
        ))}
      </div>

      {/* STATUS FILTER */}
      {selectedBuilding && (
        <div className="flex flex-wrap gap-2 mb-6">
          {statusFilters.map(status => (
            <Button
              key={status}
              variant={
                statusFilter === status ? 'default' : 'outline'
              }
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>
                  Service Date
                  <p className="text-xs text-muted-foreground">
                    (Scheduled)
                  </p>
                </TableHead>
                <TableHead>Service Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!selectedBuilding ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Please select a building to view services.
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length ? (
                filteredBookings.map(booking => (
                  <TableRow key={booking._id}>
                    <TableCell className="font-medium">
                      {booking.service}
                    </TableCell>
                    <TableCell>{booking.userName}</TableCell>
                    <TableCell>
                      {new Date(booking.date).toLocaleDateString(
                        'en-CA',
                        { timeZone: 'UTC' }
                      )}
                    </TableCell>
                    <TableCell>
                      {booking.time || (
                        <span className="text-xs text-muted-foreground">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === 'Completed'
                            ? 'outline'
                            : 'secondary'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleViewDetails(booking)
                            }
                          >
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No services found for this building and status.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* DETAILS MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedBooking && (
            <BookingDetails
              booking={selectedBooking}
              provider={getProviderForBooking(selectedBooking)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
