import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <div className="p-8">User not found.</div>;

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-bold mt-2">{user.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 flex justify-center">
            <div>
              <span className="font-semibold">{user.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
