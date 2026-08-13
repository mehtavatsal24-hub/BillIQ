import { auth } from "./firebase";

export async function expandTechnicalSpec(input: string, industry?: string, letterhead?: string): Promise<string> {
  if (!input || input.trim().length < 2) return input;

  try {
    let token = "";
    if (auth?.currentUser) {
      try { token = await auth.currentUser.getIdToken(); } catch (e) {}
    }

    const res = await fetch("/api/expand-technical-spec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ input, industry, letterhead }),
    });

    if (!res.ok) throw new Error("API call failed");
    const data = await res.json();
    const result = data.result?.trim() || input;

    if (result.startsWith("CLARIFICATION_REQUIRED:")) {
      return input;
    }

    return result;
  } catch (error) {
    console.error("Error expanding technical spec:", error);
    return input;
  }
}
