import { account } from "@/src/lib/appwrite";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const AuthBar = () => {
  // Remplacer 'unknown' par le type exact de la session Appwrite si connu
  const [user, setUser] = useState<unknown>(null);

  useEffect(() => {
    const checkAccount = async () => {
      try {
        const session = await account.get();
        setUser(session);
      } catch (error) {
        setUser(null);
      }
    };

    checkAccount();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      throw new Error("Failed to logout");
    }
  };

  if (user) {
    return (
      <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground cursor-pointer">
                      {(
                        user as { name: string; email: string }
                      )?.name?.[0]?.toUpperCase() ||
                        (user as { email: string })?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Disconnect</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>{(user as { email: string })?.email || "User"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/auth/login">
                <Button variant="outline">
                  <LogIn />
                  Login
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Login</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/auth/register">
                <Button variant="outline">
                  <UserPlus />
                  Register
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Register</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
