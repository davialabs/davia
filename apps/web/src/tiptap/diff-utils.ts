import DiffMatchPatch from "diff-match-patch";

// Utilities
type TopLevelBlock = {
  tagName: string;
  attrs: string;
  outerHTML: string;
  norm: string;
};

const normalizeOuterHTML = (el: Element): string => {
  const tagName = el.tagName.toLowerCase();
  const attrs = Array.from(el.attributes)
    .map((a) => `${a.name}="${a.value}"`)
    .sort()
    .join(" ");
  // Determine if the element has any non-whitespace text content
  const hasTextContent = (el.textContent || "").replace(/\s+/g, "").length > 0;
  // Normalize inner HTML to a single logical line to avoid breaking a block (e.g., ul/li, blockquote/p)
  const inner = hasTextContent
    ? el.innerHTML
        .replace(/[\n\r]+/g, " ") // collapse newlines
        .replace(/>\s+</g, "><") // remove inter-tag whitespace
        .replace(/\s{2,}/g, " ") // collapse multiple spaces
        .trim()
    : "";

  const attrsPart = attrs ? ` ${attrs}` : "";
  return `<${tagName}${attrsPart}>${inner}</${tagName}>`;
};

const parseTopLevelBlocks = (html: string): TopLevelBlock[] => {
  try {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    const blocks: TopLevelBlock[] = [];

    const children = Array.from(doc.body.children);

    for (const el of children) {
      const tagName = el.tagName.toLowerCase();
      const attrs = Array.from(el.attributes)
        .map((a) => `${a.name}="${a.value}"`)
        .sort()
        .join(" ");

      blocks.push({
        tagName,
        attrs,
        outerHTML: el.outerHTML,
        norm: normalizeOuterHTML(el),
      });
    }

    return blocks;
  } catch {
    return [];
  }
};

const wrapDiff = (oldHTML: string, newHTML: string): string => {
  const hasOld = oldHTML && oldHTML.trim().length > 0;
  const hasNew = newHTML && newHTML.trim().length > 0;

  let inner = "";
  if (hasOld) {
    inner += `<diff-old>${oldHTML}</diff-old>`;
  }
  if (hasNew) {
    inner += `<diff-new>${newHTML}</diff-new>`;
  }

  return `<diff>${inner}</diff>`;
};

/**
 * Compares two HTML strings and generates HTML with diff wrappers
 */
export function renderDiffWrappers(base: string, proposed: string): string {
  // Parse top-level blocks
  const baseBlocks = parseTopLevelBlocks(base);
  const proposedBlocks = parseTopLevelBlocks(proposed);

  // Extract and preserve the first <h1> from either side, prefer proposed
  const firstBaseH1Index = baseBlocks.findIndex((b) => b.tagName === "h1");
  const firstProposedH1Index = proposedBlocks.findIndex(
    (b) => b.tagName === "h1"
  );
  const headingHTML =
    firstProposedH1Index >= 0
      ? proposedBlocks[firstProposedH1Index]!.outerHTML
      : firstBaseH1Index >= 0
        ? baseBlocks[firstBaseH1Index]!.outerHTML
        : "<h1></h1>";

  if (firstProposedH1Index >= 0) proposedBlocks.splice(firstProposedH1Index, 1);
  if (firstBaseH1Index >= 0) baseBlocks.splice(firstBaseH1Index, 1);

  // Fast path: if contents are identical after normalization by index
  const sameLength = baseBlocks.length === proposedBlocks.length;

  if (
    sameLength &&
    baseBlocks.every((b, i) => b.norm === proposedBlocks[i]!.norm)
  ) {
    return (
      (headingHTML || "") + proposedBlocks.map((b) => b.outerHTML).join("")
    );
  }

  // Use diff-match-patch to diff at block level by normalized strings
  const dmp = new DiffMatchPatch();
  const baseJoined = baseBlocks.map((b) => b.norm).join("\n");
  const proposedJoined = proposedBlocks.map((b) => b.norm).join("\n");

  type DmpWithLines = {
    diff_linesToChars_(
      text1: string,
      text2: string
    ): { chars1: string; chars2: string; lineArray: string[] };
    diff_charsToLines_(
      diffs: Array<[number, string]>,
      lineArray: string[]
    ): void;
  };

  const dmpExt = dmp as unknown as DmpWithLines;
  const { chars1, chars2, lineArray } = dmpExt.diff_linesToChars_(
    baseJoined,
    proposedJoined
  );
  const diffs: Array<[number, string]> = dmp.diff_main(chars1, chars2, false);
  dmpExt.diff_charsToLines_(diffs, lineArray);

  // Build output by mapping diff ops back to blocks, pairing deletions with insertions
  const out: string[] = [];
  for (let i = 0; i < diffs.length; i++) {
    const [op, text] = diffs[i]!;
    if (!text) continue;

    const lines = text.split("\n").filter((l) => l.length > 0);

    if (op === 0) {
      // Equal: emit proposed blocks as-is
      for (const norm of lines) {
        const match = proposedBlocks.find((b) => b.norm === norm);
        out.push(match ? match.outerHTML : norm);
      }
      continue;
    }

    if (op === -1) {
      // Deletion: if next is insertion, pair them; otherwise pure deletion
      const next = diffs[i + 1];
      if (next && next[0] === 1) {
        const insertedLines = (next[1] as string)
          .split("\n")
          .filter((l) => l.length > 0);
        const maxLen = Math.max(lines.length, insertedLines.length);
        for (let k = 0; k < maxLen; k++) {
          const oldNorm = lines[k];
          const newNorm = insertedLines[k];
          const oldMatch = oldNorm
            ? baseBlocks.find((b) => b.norm === oldNorm)
            : null;
          const newMatch = newNorm
            ? proposedBlocks.find((b) => b.norm === newNorm)
            : null;
          // Special case: mdx-component insertions should be emitted directly
          if (!oldMatch && newMatch && newMatch.tagName === "mdx-component") {
            out.push(newMatch.outerHTML);
          } else {
            out.push(
              wrapDiff(oldMatch?.outerHTML || "", newMatch?.outerHTML || "")
            );
          }
        }
        i += 1; // Skip the paired insertion
        continue;
      }
      // Pure deletions
      for (const norm of lines) {
        const match = baseBlocks.find((b) => b.norm === norm);
        out.push(wrapDiff(match ? match.outerHTML : norm, ""));
      }
      continue;
    }

    if (op === 1) {
      // Pure insertions
      for (const norm of lines) {
        const match = proposedBlocks.find((b) => b.norm === norm);
        if (match && match.tagName === "mdx-component") {
          out.push(match.outerHTML);
        } else {
          out.push(wrapDiff("", match ? match.outerHTML : norm));
        }
      }
      continue;
    }
  }

  const html = (headingHTML || "") + out.join("");

  // Post-process: if last block is a <diff> with only <diff-new><p></p></diff-new>,
  // remove it and ensure content ends with a single <p></p>
  try {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    const children = Array.from(doc.body.children);
    const last = children[children.length - 1];

    const isEmptyP = (el: Element | null) =>
      !!el && el.tagName.toLowerCase() === "p" && el.innerHTML.trim() === "";

    if (last && last.tagName.toLowerCase() === "diff") {
      const diffOld = last.querySelector("diff-old");
      const diffNew = last.querySelector("diff-new");
      const onlyNew = !!diffNew && !diffOld;

      if (onlyNew && diffNew) {
        const newChildren = Array.from(diffNew.children).filter(
          (n) => n.nodeType === 1
        ) as Element[];
        if (newChildren.length === 1 && isEmptyP(newChildren[0] || null)) {
          last.remove();
          const tail = doc.body.lastElementChild as Element | null;
          if (!isEmptyP(tail)) {
            const p = doc.createElement("p");
            doc.body.appendChild(p);
          }
          return doc.body.innerHTML;
        }
      }
    }

    return html;
  } catch {
    return html;
  }
}

/**
 * Extracts content from diff wrappers, keeping only old or new version
 */
export function stripDiffWrappers(
  content: string,
  mode: "old" | "new" = "new"
): string {
  try {
    const doc = new DOMParser().parseFromString(content || "", "text/html");

    // Find all <diff> elements anywhere in the document
    const diffs = Array.from(doc.querySelectorAll("diff"));

    for (const diff of diffs) {
      const target = diff.querySelector(
        mode === "old" ? "diff-old" : "diff-new"
      );

      if (target) {
        // Replace the <diff> node with the inner content of the selected target
        const container = doc.createElement("div");
        container.innerHTML = target.innerHTML;
        while (container.firstChild) {
          diff.parentNode?.insertBefore(container.firstChild, diff);
        }
        diff.remove();
      } else {
        // No selected side present → remove the whole <diff>
        diff.remove();
      }
    }

    return doc.body.innerHTML;
  } catch {
    // Fallback: regex-based approach if DOMParser fails for any reason
    if (mode === "old") {
      return (
        content
          // Remove everything inside diff-new blocks
          .replace(/<diff-new[\s\S]*?<\/diff-new>/g, "")
          // Unwrap diff-old blocks (keep their inner content)
          .replace(/<diff-old[^>]*>/g, "")
          .replace(/<\/diff-old>/g, "")
          // Remove remaining diff wrappers
          .replace(/<diff[^>]*>/g, "")
          .replace(/<\/diff>/g, "")
      );
    }
    // mode === "new"
    return (
      content
        // Remove everything inside diff-old blocks
        .replace(/<diff-old[\s\S]*?<\/diff-old>/g, "")
        // Unwrap diff-new blocks (keep their inner content)
        .replace(/<diff-new[^>]*>/g, "")
        .replace(/<\/diff-new>/g, "")
        // Remove remaining diff wrappers
        .replace(/<diff[^>]*>/g, "")
        .replace(/<\/diff>/g, "")
    );
  }
}

/**
 * Checks if HTML contains any diff elements
 */
export function checkHasDiffs(content: string): boolean {
  if (!content) return false;

  try {
    const doc = new DOMParser().parseFromString(content || "", "text/html");
    return doc.querySelector("diff") !== null;
  } catch {
    // Fallback to a lightweight regex when DOMParser is unavailable
    return /<\s*diff(\s|>)/i.test(content);
  }
}
