import fs from "fs";
import path from "path";

type TemplateName = "verification" | "welcome" | "notification" | "password-reset";

export function loadTemplate(
    name: TemplateName,
    variables: Record<string, string> = {}
) {
    const filePath = path.join(process.cwd(), "src/emails/templates", `${name}.html`);

    let html = fs.readFileSync(filePath, "utf-8");

    for (const [key, value] of Object.entries(variables)) {
        html = html.replaceAll(`{{${key}}}`, value);
    }

    return html;
}