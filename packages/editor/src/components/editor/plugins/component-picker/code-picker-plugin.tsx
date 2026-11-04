import { useMemo } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { CodeXml } from "lucide-react";

import { insertCodeBlock } from "../../extensions/code.tsx";
import { type ComponentPickerItem, useComponentPickerItems } from "./component-picker-plugin.tsx";
import { useTranslation } from "../i18n-plugin.tsx";

export function CodePickerPlugin() {
  const [editor] = useLexicalComposerContext();
  const { t } = useTranslation();

  const items = useMemo<ComponentPickerItem[]>(
    () => [
      {
        value: "code-block",
        label: t.insertCodeBlock,
        icon: <CodeXml className="text-muted-foreground" />,
        keywords: ["code", "codeblock", "javascript", "python", "js"],
        onSelect: () => insertCodeBlock(editor),
      },
    ],
    [editor, t],
  );

  useComponentPickerItems(items);

  return null;
}
