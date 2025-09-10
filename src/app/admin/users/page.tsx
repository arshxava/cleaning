
'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Home,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch users.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold">
          Registered Users
        </h1>
        <p className="text-muted-foreground mt-2">
          A list of all users who have signed up for the service.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>
            Browse through all registered user profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {loading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.uid}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-lg">{user.name}</p>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {user.email}</p>
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {user.phone}</p>
                        <p className="flex items-center gap-2"><Building className="h-4 w-4" /> {user.school}</p>
                        <p className="flex items-center gap-2"><Home className="h-4 w-4" /> {user.roomSize}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Joined on{' '}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground bg-slate-50 py-8 rounded-md">
                <p>No users have signed up yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
