import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Setting } from "@/lib/generated/prisma"; // Import Setting type

// Default settings if none exist
const defaultSettings = {
  theme: "dark",
  siteTitle: "PORTFOLIO",
  showPortrait: true,
  resumeUrl: "/resume.pdf",
  globalFontFamily: "font-sans",
};

// GET /api/settings - Fetch the first (or only) settings document
export async function GET(request: Request) {
  try {
    let settings = await prisma.setting.findFirst();

    // If no settings exist, create the default one
    if (!settings) {
      console.log("No settings found, creating default settings.");
      settings = await prisma.setting.create({
        data: defaultSettings,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        message: "Error fetching settings",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update the first (or only) settings document
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // Allow updating specific fields
    const { theme, showPortrait, resumeUrl, globalFontFamily } = body;

    const updateData: Partial<Setting> = {};
    if (theme !== undefined) updateData.theme = theme;
    if (showPortrait !== undefined) updateData.showPortrait = showPortrait;
    if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl;
    if (globalFontFamily !== undefined)
      updateData.globalFontFamily = globalFontFamily;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // Find the ID of the first settings document to update it.
    // If multiple settings documents are not intended, findFirst is appropriate.
    const currentSettings = await prisma.setting.findFirst();

    let updatedSettings;
    if (currentSettings) {
      // If settings exist, update them
      updatedSettings = await prisma.setting.update({
        where: { id: currentSettings.id },
        data: updateData,
      });
    } else {
      // If no settings exist, create them (upsert logic essentially)
      // Merge default settings with any potentially provided update data
      console.log(
        "No settings found during PUT, creating new settings with provided data."
      );
      updatedSettings = await prisma.setting.create({
        data: { ...defaultSettings, ...updateData },
      });
    }

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        message: "Error updating settings",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
