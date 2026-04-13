import { NextRequest, NextResponse } from "next/server";

import { parseEntityYaml } from "@/lib/yaml-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file field in form data" },
        { status: 400 },
      );
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".yaml") && !name.endsWith(".yml")) {
      return NextResponse.json(
        { error: "File must be a .yaml or .yml file" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const parsed = parseEntityYaml(text);

    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse YAML file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
