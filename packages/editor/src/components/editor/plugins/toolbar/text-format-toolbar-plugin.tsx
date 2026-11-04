import { FORMAT_TEXT_COMMAND, type TextFormatType } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";

import {
  Bold,
  CaseLower,
  CaseSensitive,
  CaseUpper,
  Code,
  Highlighter,
  Italic,
  type LucideIcon,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "lucide-react";

import { useFormatStateValue } from "../../extensions/format-state.tsx";
import type { Locale } from "../../locales.ts";
import { useTranslation } from "../i18n-plugin.tsx";
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip.tsx";

const FORMAT_GROUPS: {
  format: TextFormatType;
  labelKey: keyof Locale;
  icon: LucideIcon;
}[][] = [
  [
    { format: "bold", labelKey: "bold", icon: Bold },
    { format: "italic", labelKey: "italic", icon: Italic },
    { format: "underline", labelKey: "underline", icon: Underline },
    { format: "strikethrough", labelKey: "strikethrough", icon: Strikethrough },
  ],
  [
    { format: "highlight", labelKey: "highlight", icon: Highlighter },
    { format: "code", labelKey: "inlineCode", icon: Code },
  ],
  [
    { format: "subscript", labelKey: "subscript", icon: Subscript },
    { format: "superscript", labelKey: "superscript", icon: Superscript },
  ],
  [
    { format: "uppercase", labelKey: "uppercase", icon: CaseUpper },
    { format: "lowercase", labelKey: "lowercase", icon: CaseLower },
    { format: "capitalize", labelKey: "titleCase", icon: CaseSensitive },
  ],
];

function FormatToggleGroup({ items }: { items: (typeof FORMAT_GROUPS)[number] }) {
  const [editor] = useLexicalComposerContext();
  const { t } = useTranslation();
  const formats = useFormatStateValue("formats");
  const isEditable = useLexicalEditable();
  return (
    <ToggleGroup
      multiple
      variant="outline"
      size="sm"
      spacing={0}
      disabled={!isEditable}
      value={formats}
      onValueChange={(value) => {
        const next = new Set(value as TextFormatType[]);
        for (const { format } of items) {
          if (next.has(format) !== formats.includes(format)) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
          }
        }
      }}
    >
      {items.map(({ format, labelKey, icon: Icon }) => (
        <Tooltip key={format}>
          <TooltipTrigger
            render={
              <ToggleGroupItem value={format} aria-label={t[labelKey]}>
                <Icon />
              </ToggleGroupItem>
            }
          />
          <TooltipContent>{t[labelKey]}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}

export function TextFormatToolbarPlugin({
  formats = "all",
}: {
  formats?: "basic" | "all" | readonly TextFormatType[];
}) {
  const groups =
    typeof formats !== "string"
      ? FORMAT_GROUPS.map((group) => group.filter((item) => formats.includes(item.format))).filter(
          (group) => group.length > 0,
        )
      : FORMAT_GROUPS.slice(0, formats === "basic" ? 1 : undefined);
  return (
    <>
      {groups.map((items, groupIndex) => (
        <FormatToggleGroup key={groupIndex} items={items} />
      ))}
    </>
  );
}
