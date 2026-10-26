import { parse } from "@vue/compiler-sfc";
import { parse as parseTemplate } from "@vue/compiler-dom";
import type { Plugin } from "vite";

// Translate presentation text at compile time; model values, keys and handlers stay intact.
// This also covers strings produced by the workflow engine without changing saved case data.
export function templateI18n(): Plugin {
  return {
    name: "prototype-template-i18n",
    enforce: "pre",
    transform(source, id) {
      if (!id.endsWith(".vue")) return;
      const template = parse(source).descriptor.template;
      if (!template) return;
      const ast = parseTemplate(template.content),
        edits: { start: number; end: number; text: string }[] = [];
      const translated = (value: string) => `$t(${value})`;
      function visit(node: any) {
        if (node.type === 2 && node.content.trim())
          edits.push({
            start: node.loc.start.offset,
            end: node.loc.end.offset,
            text: `{{ ${translated(JSON.stringify(node.content))} }}`,
          });
        if (node.type === 5)
          edits.push({
            start: node.content.loc.start.offset,
            end: node.content.loc.end.offset,
            text: translated(node.content.content),
          });
        if (node.type === 1) {
          for (const prop of node.props || []) {
            if (
              prop.type === 6 &&
              (["aria-label", "placeholder", "alt"].includes(prop.name) ||
                (prop.name === "title" && node.tagType === 0)) &&
              prop.value
            ) {
              edits.push({
                start: prop.loc.start.offset,
                end: prop.loc.end.offset,
                text: `:${prop.name}='${translated(JSON.stringify(prop.value.content)).replaceAll("'", "&#39;")}'`,
              });
            }
            if (
              prop.type === 7 &&
              prop.name === "bind" &&
              (["aria-label", "placeholder", "alt"].includes(
                prop.arg?.content,
              ) ||
                (prop.arg?.content === "title" && node.tagType === 0)) &&
              prop.exp
            ) {
              edits.push({
                start: prop.exp.loc.start.offset,
                end: prop.exp.loc.end.offset,
                text: translated(prop.exp.content),
              });
            }
          }
        }
        for (const child of node.children || []) visit(child);
      }
      visit(ast);
      let result = template.content;
      for (const e of edits.sort((a, b) => b.start - a.start))
        result = result.slice(0, e.start) + e.text + result.slice(e.end);
      return (
        source.slice(0, template.loc.start.offset) +
        result +
        source.slice(template.loc.end.offset)
      );
    },
  };
}
