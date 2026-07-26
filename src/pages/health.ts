import type { APIRoute } from "astro";
import { text } from "../lib/http";

export const prerender = false;

export const GET: APIRoute = () => text("ok");
