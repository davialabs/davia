export const MDX_IMPLEMENTATION_INSTRUCTIONS = `<mdx_implementation>
## Davia-Specific MDX Component Implementation

### Critical Component Requirements

1. **Component File Structure**
  - MDX components are created in the "components/" directory
  - File paths must match the data-path attribute exactly
  - Components are embedded in HTML pages via \`<mdx-component data-path="components/name.mdx"></mdx-component>\`
  - Components can be shared across multiple HTML pages
  - NO markdown content - components contain only interactive functionality

2. **Imports**
  - Data: \`import dataSource from "~/data/name.json"\`
  - UI: Import shadcn components from \`@/components/ui/*\`
  - Icons: Import icons from \`lucide-react\` (e.g., \`import { ChevronDown, Plus, Search } from "lucide-react"\`)
  - Utilities: \`import { cn } from "@/lib/utils"\`, \`import { useIsMobile } from "@/hooks/use-mobile"\`

3. **React Usage**
  - React is globally available - use \`React.useState\`, \`React.useEffect\`, etc.
  - Always prefix React hooks and methods with \`React.\`

4. **Component Data Persistence**
  - Bind component state to a specific data source: \`const { data, updateData } = useData(dataSource);\`
  - \`dataSource\` is the imported JSON reference (e.g., \`import dataSource from "~/data/name.json"\`)
  - Updates via \`updateData(newData)\` persist to the underlying JSON file and are shared wherever that file is used
  - **Avoid hardcoding data in component files** — define initial structure in the JSON file, and use \`useData(importedRef)\` to read/update it
  - Use the spread operator to preserve existing data when updating

   **Component Example:**
  \`\`\`mdx
  import counter from "~/data/counter.json";
  import { Button } from "@/components/ui/button";

  export function InteractiveCounter() {
    const { data, updateData } = useData(counter);
    const count = data.count || 0;
    
    const increment = () => {
      updateData({
        ...data,
        count: count + 1
      });
    };

    return (
      <div className="p-4 border rounded">
        <p>Count: {count}</p>
        <Button onClick={increment}>Increment</Button>
      </div>
    );
  }

  <InteractiveCounter />
  \`\`\`

5. **Tailwind CSS v4 (Safelist ONLY)**
  - The project uses Tailwind v4 with a strict safelist. Only the classes below are allowed.
  - Do NOT use any class names not present in this safelist (they will be stripped at build time).
  - Use \`className\` for styling as much as possible but if you need very specific styling, use inline styles (try to avoid if possible).

   **Color Usage Guidelines:**
   - **Text Colors**: Do NOT use text colors unless explicitly requested by users. Text colors are set globally through shadcn and nextjs.
   - **Background Colors**: When using background colors (not predefined globals like primary, muted, accent), always include \`dark:\` variants for light/dark mode compatibility.

  \`\`\`css
  /* Layout */
  @source inline("{,sm:,md:,lg:,xl:,2xl:}{block,inline-block,inline,flex,inline-flex,grid,inline-grid,hidden}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}overflow-{auto,hidden,visible,scroll,x-auto,y-auto}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}position-{static,relative,absolute,fixed,sticky}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}{top,bottom,left,right,inset,inset-x,inset-y}-{0,auto}");

  /* Flexbox & Grid */
  @source inline("{,sm:,md:,lg:,xl:,2xl:}flex-{row,row-reverse,col,col-reverse}", "{,sm:,md:,lg:,xl:,2xl:}flex-wrap", "{,sm:,md:,lg:,xl:,2xl:}flex-nowrap");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}items-{start,end,center,baseline,stretch}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}justify-{start,end,center,between,around,evenly}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}gap-{0,1,2,3,4,5,6,8,10,12,16,20,24,32}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}grid-cols-{1,2,3,4,5,6,7,8,9,10,11,12}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}col-span-{1,2,3,4,5,6,7,8,9,10,11,12,full}");

  /* Spacing */
  @source inline("{,sm:,md:,lg:,xl:,2xl:}{p,m,px,py,pt,pr,pb,pl,mx,my,mt,mr,mb,ml}-{0,1,2,3,4,5,6,8,10,12,16,20,24,32,auto}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}space-{x,y}-{0,1,2,3,4,5,6,8,10,12,16,20,24,32}");

  /* Sizing */
  @source inline("{,sm:,md:,lg:,xl:,2xl:}{w,h}-{auto,full,screen,fit,min,max,'1/2','1/3','2/3','1/4','3/4','1/5','2/5','3/5','4/5'}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}max-w-{xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,prose}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}{w,h}-{4,5,6,7,8,9,10,11,12}");

  /* Typography */
  @source inline("{,sm:,md:,lg:,xl:,2xl:}text-{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl,6xl}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}font-{light,normal,medium,semibold,bold,extrabold}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}text-{left,center,right,justify}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}leading-{tight,snug,normal,relaxed,loose}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}italic", "{,sm:,md:,lg:,xl:,2xl:}not-italic", "{,sm:,md:,lg:,xl:,2xl:}underline", "{,sm:,md:,lg:,xl:,2xl:}line-through");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}list-{disc,decimal}", "{,sm:,md:,lg:,xl:,2xl:}list-inside");

  /* Colors (semantic & grayscale) */
  @source inline("{,dark:,hover:,focus:,focus-visible:,active:}{bg,text,border,ring,fill,stroke}-{background,foreground,primary,primary-foreground,secondary,secondary-foreground,muted,muted-foreground,accent,accent-foreground,destructive,card,border,input,ring}");
  @source inline("{,dark:,hover:,focus:,focus-visible:,active:}{bg,text,border,ring,fill,stroke}-{slate,gray,zinc,neutral,stone}-{50,{100..900..100},950}");
  @source inline("{,dark:,hover:,focus:,focus-visible:,active:}{bg,text,border,ring,fill,stroke}-{red,orange,amber,yellow,lime,green,emerald,teal,cyan,sky,blue,indigo,violet,purple,fuchsia,pink,rose}-{50,{100..900..100},950}");
  @source inline("{,dark:,hover:,focus:,focus-visible:,active:}{bg,text,border,ring,fill,stroke}-{transparent,white,black}");
  @source inline("ring-offset-{background,foreground,card,popover,white,black}");

  /* Borders */
  @source inline("{,sm:,md:,lg:,xl:,2xl:}rounded{,-t,-r,-b,-l,-tl,-tr,-br,-bl}-{sm,md,lg,xl,2xl,3xl,full}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}border{,-x,-y,-t,-r,-b,-l}-{0,1,2,4,8}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}divide-{x,y}-{0,1,2,4,8}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}ring-{0,1,2,4,8}");

  /* Effects & Transitions */
  @source inline("{,sm:,md:,lg:,xl:,2xl:}shadow-{sm,md,lg,xl,2xl,inner,none}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}opacity-{0,25,50,75,100}");
  @source inline("{,sm:,md:,lg:,xl:,2xl:}transition-all", "{,sm:,md:,lg:,xl:,2xl:}duration-{150,200,300,500,700}");
  \`\`\`
</mdx_implementation>`;
