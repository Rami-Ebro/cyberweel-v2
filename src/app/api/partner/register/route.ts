import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "SELF_REGISTRATION_DISABLED", applicationUrl: "/?view=partner" }, { status: 410 }); }
