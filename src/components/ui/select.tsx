"use client";

import * as React from "react";
import * as Ariakit from "@ariakit/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/utils/css";

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  defaultValue?: string;
};

const SelectContext = React.createContext<
  SelectContextValue & {
    store?: Ariakit.SelectStore;
  }
>({});

function Select({
  value,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  name,
  required,
  defaultValue,
  children,
  ...props
}: SelectContextValue & {
  children?: React.ReactNode;
}) {
  const store = Ariakit.useSelectStore({
    value,
    setValue: onValueChange,
    open,
    setOpen: onOpenChange,
    defaultValue,
    defaultOpen,
  });

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        defaultOpen,
        onOpenChange,
        disabled,
        name,
        required,
        defaultValue,
        store,
      }}
    >
      <Ariakit.SelectProvider store={store}>
        <div data-slot="select" {...props}>
          {children}
        </div>
      </Ariakit.SelectProvider>
    </SelectContext.Provider>
  );
}

function SelectGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return <div data-slot="select-group" className={className} {...props} />;
}

function SelectValue({
  placeholder,
  children,
  className,
  ...props
}: {
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span data-slot="select-value" className={className} {...props}>
      {children || placeholder}
    </span>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  size?: "sm" | "default";
}) {
  const context = React.useContext(SelectContext);

  // Extract SelectValue component from children to render it inside the button
  let selectValue: React.ReactNode = null;
  let otherChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectValue) {
      selectValue = child;
    } else {
      otherChildren.push(child);
    }
  });

  return (
    <Ariakit.Select
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      disabled={context.disabled}
      name={context.name}
      required={context.required}
      {...props}
    >
      {selectValue}
      {otherChildren}
      <ChevronDownIcon className="size-4 opacity-50" />
    </Ariakit.Select>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  position?: "popper" | "item-aligned";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  return (
    <Ariakit.SelectPopover
      data-slot="select-content"
      gutter={sideOffset}
      sameWidth
      className={cn(
        "bg-popover text-popover-foreground data-enter:animate-in data-leave:animate-out data-leave:fade-out-0 data-enter:fade-in-0 data-leave:zoom-out-95 data-enter:zoom-in-95 relative z-50 max-h-96 min-w-32 overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </Ariakit.SelectPopover>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Ariakit.SelectLabel>) {
  return (
    <Ariakit.SelectLabel
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value,
  disabled,
  ...props
}: React.ComponentPropsWithoutRef<typeof Ariakit.SelectItem> & {
  value: string;
}) {
  return (
    <Ariakit.SelectItem
      data-slot="select-item"
      className={cn(
        "data-active-item:bg-accent data-active-item:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      value={value}
      disabled={disabled}
      {...props}
    >
      <span className="flex items-center gap-2">{children}</span>
      <Ariakit.SelectItemCheck className="absolute right-2 flex size-3.5 items-center justify-center">
        <CheckIcon className="size-4" />
      </Ariakit.SelectItemCheck>
    </Ariakit.SelectItem>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Ariakit.SelectSeparator>) {
  return (
    <Ariakit.SelectSeparator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

// Ariakit doesn't have scroll buttons by default, but we can create placeholder components for API compatibility
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return null; // Ariakit handles scrolling automatically
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return null; // Ariakit handles scrolling automatically
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
