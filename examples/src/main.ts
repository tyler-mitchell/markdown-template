import MarkdownIt from "markdown-it";
import notice from "../templates/notice.mdt";
import release from "../data/release.json";
import "./style.css";

const renderer = new MarkdownIt();
const input = document.querySelector<HTMLTextAreaElement>("#input")!;
const preview = document.querySelector<HTMLElement>("#preview")!;
const errors = document.querySelector<HTMLElement>("#errors")!;
const markdown = document.querySelector<HTMLElement>("#markdown")!;

document.querySelector("#template")!.textContent = notice.source;
input.value = JSON.stringify(release, null, 2);

async function render() {
  try {
    const result = await notice.standard.validate(JSON.parse(input.value));
    if (result.issues) {
      errors.textContent = result.issues.map(({ message }) => message).join("\n");
      return;
    }
    const content = notice.renderValidated(result.value);
    preview.innerHTML = renderer.render(content);
    markdown.textContent = content;
    errors.textContent = "";
  } catch (error) {
    errors.textContent = error instanceof Error ? error.message : String(error);
  }
}

input.addEventListener("input", render);
await render();
