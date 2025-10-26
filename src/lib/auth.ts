import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";

export const getSession = () => getServerSession();
