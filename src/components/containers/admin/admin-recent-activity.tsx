import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRecentActivity, type ActivityItem } from "@/lib/functions/admin/recent-activity";
import { useQuery } from "@tanstack/react-query";
import { User, Building2, Store, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'user':
      return <User className="size-4" />;
    case 'tenant':
      return <Building2 className="size-4" />;
    case 'shop':
      return <Store className="size-4" />;
    case 'product':
      return <Package className="size-4" />;
    default:
      return <User className="size-4" />;
  }
}

function getActivityColor(type: ActivityItem['type']) {
  switch (type) {
    case 'user':
      return 'text-blue-600 bg-blue-50';
    case 'tenant':
      return 'text-green-600 bg-green-50';
    case 'shop':
      return 'text-amber-600 bg-amber-50';
    case 'product':
      return 'text-purple-600 bg-purple-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function getActivityBadgeVariant(type: ActivityItem['type']): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case 'user':
      return 'default';
    case 'tenant':
      return 'secondary';
    case 'shop':
      return 'outline';
    case 'product':
      return 'destructive';
    default:
      return 'default';
  }
}

export default function AdminRecentActivity() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: () => getRecentActivity(),
  });

  if (isLoading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="animate-pulse">
                  <div className="size-8 bg-muted rounded-full" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-destructive">
            Error loading activity: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{activity.title}</p>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{activity.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    {activity.userName && (
                      <p className="text-xs text-muted-foreground">
                        by {activity.userName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No recent activity found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
