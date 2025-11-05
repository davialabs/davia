"use client";

import * as React from "react";

// --- Lib ---
import { getElementOverflowPosition } from "@/tiptap/collab-utils";

// --- Tiptap UI ---
import {
  filterSuggestionItems,
  EmptyNodeSuggestionMenu,
  type SuggestionMenuProps,
  type SuggestionItem,
  type SuggestionMenuRenderProps,
} from "./empty-node-suggestion-menu-index";

// --- Hooks ---
import {
  useSlashDropdownMenu,
  type SlashMenuConfig,
} from "./use-slash-dropdown-menu";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardBody, CardGroupLabel, CardItemGroup } from "./card";

type SlashDropdownMenuProps = Omit<
  SuggestionMenuProps,
  "items" | "children"
> & {
  config?: SlashMenuConfig;
};

export const SlashDropdownMenu = (props: SlashDropdownMenuProps) => {
  const { config, ...restProps } = props;
  const { getSlashMenuItems } = useSlashDropdownMenu(config);

  return (
    <EmptyNodeSuggestionMenu
      char="/"
      pluginKey="slashDropdownMenu"
      decorationClass="slash-decoration"
      decorationContent="Filter..."
      selector="slash-dropdown-menu"
      items={({ query, editor }) =>
        filterSuggestionItems(getSlashMenuItems(editor), query)
      }
      {...restProps}
    >
      {(props) => <List {...props} config={config} />}
    </EmptyNodeSuggestionMenu>
  );
};

const Item = (props: {
  item: SuggestionItem;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { item, isSelected, onSelect } = props;
  const itemRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const selector = document.querySelector(
      '[data-selector="slash-dropdown-menu"]'
    ) as HTMLElement;
    if (!itemRef.current || !isSelected || !selector) return;

    const overflow = getElementOverflowPosition(itemRef.current, selector);

    if (overflow === "top") {
      itemRef.current.scrollIntoView(true);
    } else if (overflow === "bottom") {
      itemRef.current.scrollIntoView(false);
    }
  }, [isSelected]);

  const BadgeIcon = item.badge;

  return (
    <Button
      ref={itemRef}
      variant="ghost"
      size="sm"
      className={`w-full justify-start ${isSelected ? "bg-accent text-accent-foreground" : ""}`}
      onClick={onSelect}
    >
      {BadgeIcon && <BadgeIcon className="size-4" />}
      {item.title}
    </Button>
  );
};

const List = ({
  items,
  selectedIndex,
  onSelect,
  config,
}: SuggestionMenuRenderProps & { config?: SlashMenuConfig }) => {
  const renderedItems = React.useMemo(() => {
    const rendered: React.ReactElement[] = [];
    const showGroups = config?.showGroups !== false;

    if (!showGroups) {
      items.forEach((item, index) => {
        rendered.push(
          <Item
            key={`item-${index}-${item.title}`}
            item={item}
            isSelected={index === selectedIndex}
            onSelect={() => onSelect(item)}
          />
        );
      });
      return rendered;
    }

    const groups: {
      [groupLabel: string]: { items: SuggestionItem[]; indices: number[] };
    } = {};

    items.forEach((item, index) => {
      const groupLabel = item.group || "";
      if (!groups[groupLabel]) {
        groups[groupLabel] = { items: [], indices: [] };
      }
      groups[groupLabel].items.push(item);
      groups[groupLabel].indices.push(index);
    });

    Object.entries(groups).forEach(([groupLabel, groupData], groupIndex) => {
      if (groupIndex > 0) {
        rendered.push(<Separator key={`separator-${groupIndex}`} />);
      }

      const groupItems = groupData.items.map((item, itemIndex) => {
        const originalIndex = groupData.indices[itemIndex];
        return (
          <Item
            key={`item-${originalIndex}-${item.title}`}
            item={item}
            isSelected={originalIndex === selectedIndex}
            onSelect={() => onSelect(item)}
          />
        );
      });

      if (groupLabel) {
        rendered.push(
          <CardItemGroup key={`group-${groupIndex}-${groupLabel}`}>
            <CardGroupLabel>{groupLabel}</CardGroupLabel>
            {groupItems}
          </CardItemGroup>
        );
      } else {
        rendered.push(...groupItems);
      }
    });

    return rendered;
  }, [items, selectedIndex, onSelect, config?.showGroups]);

  if (!renderedItems.length) {
    return null;
  }

  return (
    <Card className="w-full min-w-60 max-h-80">
      <CardBody>{renderedItems}</CardBody>
    </Card>
  );
};
